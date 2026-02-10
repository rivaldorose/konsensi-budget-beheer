import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ALLOWED_ORIGINS = [
  'https://konsensi-budgetbeheer.nl',
  'https://www.konsensi-budgetbeheer.nl',
];

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
};

const systemPrompt = `Je bent een expert in het lezen van Nederlandse financiële documenten zoals facturen, bonnetjes, loonstroken en rekeningen. Extraheer de gevraagde gegevens uit het document.

BELANGRIJKE CONTEXT:
- Nederlandse documenten gebruiken komma als decimaalteken (€ 120,00 = 120.00)
- Let op bedragen met € teken of EUR
- Datums kunnen in DD-MM-YYYY, DD/MM/YYYY of YYYY-MM-DD formaat zijn
- Converteer datums altijd naar YYYY-MM-DD formaat

BELANGRIJK VOOR BEDRAGEN:
- Converteer Nederlandse bedragen naar decimaal (€ 1.234,56 = 1234.56)
- Verwijder € tekens en spaties
- Zoek naar het meest relevante bedrag (totaal, netto, te betalen)

Return ALLEEN een valide JSON object met de gevraagde velden.`;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }

  try {
    const { file_url, json_schema } = await req.json();

    if (!file_url) {
      throw new Error('No file URL provided');
    }

    // Get Anthropic API key from environment
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    console.log('[extract-data] Processing file URL:', file_url);
    console.log('[extract-data] Schema:', JSON.stringify(json_schema));

    // Fetch the file from the URL
    const fileResponse = await fetch(file_url);
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file: ${fileResponse.status}`);
    }

    const contentType = fileResponse.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await fileResponse.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    console.log('[extract-data] File fetched, content-type:', contentType, 'size:', base64.length);

    // Determine content type for Claude
    const isDocument = contentType === 'application/pdf';
    const claudeContentType = isDocument ? 'document' : 'image';

    // Build the extraction prompt based on schema
    let extractionPrompt = 'Analyseer dit Nederlandse document en extraheer de volgende gegevens:\n\n';

    if (json_schema && json_schema.properties) {
      for (const [key, value] of Object.entries(json_schema.properties)) {
        const prop = value as any;
        extractionPrompt += `- ${key}: ${prop.description || key}\n`;
      }
    }

    extractionPrompt += '\nReturn ALLEEN een valide JSON object met deze velden. Gebruik null voor velden die je niet kunt vinden.';

    // Build content array
    const contentArray: any[] = [
      {
        type: claudeContentType,
        source: {
          type: 'base64',
          media_type: contentType,
          data: base64,
        },
      },
      {
        type: 'text',
        text: extractionPrompt
      }
    ];

    // Use Claude Haiku for fast, cheap parsing
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: contentArray
          }
        ],
        system: systemPrompt,
      }),
    });

    const claudeData = await response.json();

    if (claudeData.error) {
      console.error('[extract-data] Claude API error:', claudeData.error);
      throw new Error(claudeData.error.message || 'Claude API error');
    }

    const parsedContent = claudeData.content?.[0]?.text;

    if (!parsedContent) {
      throw new Error('Failed to parse document - no response from AI');
    }

    console.log('[extract-data] Claude response:', parsedContent.substring(0, 500));

    // Extract JSON from response (Claude might wrap it in markdown code blocks)
    let jsonString = parsedContent;
    const jsonMatch = parsedContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonString = jsonMatch[1].trim();
    }

    // Try to find JSON object if not properly formatted
    if (!jsonString.startsWith('{')) {
      const objectMatch = jsonString.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonString = objectMatch[0];
      }
    }

    let result: any;
    try {
      result = JSON.parse(jsonString);
    } catch (parseErr) {
      console.error('[extract-data] JSON parse error:', parseErr, 'Content:', jsonString);
      throw new Error('AI response was not valid JSON');
    }

    // Clean up and validate the result based on schema
    const validated: any = {};

    if (json_schema && json_schema.properties) {
      for (const [key, value] of Object.entries(json_schema.properties)) {
        const prop = value as any;
        let extractedValue = result[key];

        // Type conversions
        if (prop.type === 'number' && extractedValue !== null && extractedValue !== undefined) {
          if (typeof extractedValue === 'string') {
            // Handle Dutch number format
            extractedValue = extractedValue
              .replace(/[€\s]/g, '')
              .replace(/\./g, '')
              .replace(',', '.');
            extractedValue = parseFloat(extractedValue);
          }
          if (isNaN(extractedValue)) {
            extractedValue = null;
          }
        }

        // Date format validation
        if (prop.format === 'date' && extractedValue) {
          // Try to parse and reformat date
          const dateMatch = String(extractedValue).match(/(\d{1,4})[-/.](\d{1,2})[-/.](\d{1,4})/);
          if (dateMatch) {
            let year, month, day;
            if (dateMatch[1].length === 4) {
              // YYYY-MM-DD
              year = dateMatch[1];
              month = dateMatch[2].padStart(2, '0');
              day = dateMatch[3].padStart(2, '0');
            } else if (dateMatch[3].length === 4) {
              // DD-MM-YYYY
              day = dateMatch[1].padStart(2, '0');
              month = dateMatch[2].padStart(2, '0');
              year = dateMatch[3];
            } else {
              extractedValue = null;
            }
            if (year && month && day) {
              extractedValue = `${year}-${month}-${day}`;
            }
          }
        }

        validated[key] = extractedValue ?? null;
      }
    } else {
      // No schema provided, return result as-is
      Object.assign(validated, result);
    }

    console.log('[extract-data] Validated result:', validated);

    return new Response(JSON.stringify({
      status: 'success',
      output: validated
    }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[extract-data] Error:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        details: error.message || 'Failed to extract data from document'
      }),
      {
        status: 400,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      }
    );
  }
});
