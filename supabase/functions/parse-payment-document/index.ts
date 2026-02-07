import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedPaymentDocument {
  amount: number | null;
  payment_date: string | null;
  description: string | null;
  payment_method: string | null;
  reference: string | null;
  iban: string | null;
  counterparty: string | null;
  confidence: number;
}

const systemPrompt = `Je bent een expert in het lezen van Nederlandse bankafschriften, betaalbewijzen en financiële documenten. Extraheer de betalingsgegevens uit het document.

BELANGRIJKE CONTEXT:
- Nederlandse bankafschriften gebruiken komma als decimaalteken (€ 120,00 = 120.00)
- Let op bedragen met € teken of EUR
- Datums kunnen in DD-MM-YYYY, DD/MM/YYYY of YYYY-MM-DD formaat zijn
- Betalingskenmerken zijn vaak lange nummers
- IBAN nummers beginnen met NL + 2 cijfers + 4 letters + 10 cijfers

EXTRAHEER:
1. amount: Het betaalde bedrag als nummer (decimaal met punt, bijv. 120.00)
2. payment_date: Datum van de betaling (format: YYYY-MM-DD)
3. description: Omschrijving of mededeling van de betaling
4. payment_method: Type betaling - kies uit: "bank_transfer", "incasso", "ideal", "contant", "other"
5. reference: Betalingskenmerk of referentienummer
6. iban: IBAN nummer indien zichtbaar
7. counterparty: Naam van de ontvanger of afzender
8. confidence: Hoe zeker je bent over de extractie (0.0 - 1.0)

BELANGRIJK VOOR BEDRAGEN:
- Converteer Nederlandse bedragen naar decimaal (€ 1.234,56 = 1234.56)
- Verwijder € tekens en spaties
- Als er meerdere bedragen zijn, kies het meest relevante (vaak het totaal of het af-geschreven bedrag)

RETURN ALLEEN een valide JSON object in dit formaat:
{
  "amount": 120.00,
  "payment_date": "2025-02-05",
  "description": "Betaling aan Schuldeiser BV",
  "payment_method": "bank_transfer",
  "reference": "1234567890",
  "iban": "NL91ABNA0417164300",
  "counterparty": "Schuldeiser BV",
  "confidence": 0.95
}

GEEN andere tekst, ALLEEN de JSON.`;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { fileBase64, mimeType, fileName } = await req.json();

    if (!fileBase64) {
      throw new Error('No file data provided');
    }

    // Get Anthropic API key from environment
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    console.log('[parse-payment-document] Processing file:', fileName, 'type:', mimeType);

    // Determine content type for Claude
    const isDocument = mimeType === 'application/pdf';
    const contentType = isDocument ? 'document' : 'image';

    // Build content array
    const contentArray: any[] = [
      {
        type: contentType,
        source: {
          type: 'base64',
          media_type: mimeType,
          data: fileBase64,
        },
      },
      {
        type: 'text',
        text: `Analyseer dit Nederlandse betaaldocument/bankafschrift en extraheer de betalingsgegevens. Let vooral op:
- Het betaalde bedrag (met € of EUR)
- De datum van de betaling
- Omschrijving of mededeling
- IBAN en betalingskenmerk indien aanwezig

Return ALLEEN een valide JSON object.`
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
        max_tokens: 1500,
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
      console.error('[parse-payment-document] Claude API error:', claudeData.error);
      throw new Error(claudeData.error.message || 'Claude API error');
    }

    const parsedContent = claudeData.content?.[0]?.text;

    if (!parsedContent) {
      throw new Error('Failed to parse document - no response from AI');
    }

    console.log('[parse-payment-document] Claude response:', parsedContent.substring(0, 500));

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

    let result: ParsedPaymentDocument;
    try {
      result = JSON.parse(jsonString);
    } catch (parseErr) {
      console.error('[parse-payment-document] JSON parse error:', parseErr, 'Content:', jsonString);
      throw new Error('AI response was not valid JSON');
    }

    // Validate and ensure all fields with proper types
    const validated: ParsedPaymentDocument = {
      amount: parseAmount(result.amount),
      payment_date: isValidDate(result.payment_date) ? result.payment_date : null,
      description: result.description || null,
      payment_method: ['bank_transfer', 'incasso', 'ideal', 'contant', 'other'].includes(result.payment_method)
        ? result.payment_method
        : 'bank_transfer',
      reference: result.reference || null,
      iban: isValidIBAN(result.iban) ? result.iban : null,
      counterparty: result.counterparty || null,
      confidence: typeof result.confidence === 'number' ? Math.min(1, Math.max(0, result.confidence)) : 0.7
    };

    console.log('[parse-payment-document] Validated result:', validated);

    return new Response(JSON.stringify({
      status: 'success',
      output: validated
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[parse-payment-document] Error:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        details: error.message || 'Failed to parse payment document'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper functions
function parseAmount(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Math.round(value * 100) / 100;
  if (typeof value === 'string') {
    // Handle Dutch number format (1.234,56 or 1234,56)
    const cleaned = value
      .replace(/[€\s]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : Math.round(parsed * 100) / 100;
  }
  return null;
}

function isValidDate(date: any): boolean {
  if (!date || typeof date !== 'string') return false;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

function isValidIBAN(iban: any): boolean {
  if (!iban || typeof iban !== 'string') return false;
  // Basic Dutch IBAN format check
  return /^NL\d{2}[A-Z]{4}\d{10}$/.test(iban.replace(/\s/g, '').toUpperCase());
}
