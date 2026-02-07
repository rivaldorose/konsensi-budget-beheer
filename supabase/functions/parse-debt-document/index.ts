import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedDebtDocument {
  creditor_name: string;
  creditor_type: string;
  case_number: string | null;
  original_amount: number;
  reminder_costs: number;
  collection_costs: number;
  interest_costs: number;
  total_amount: number;
  debt_date: string | null;
  payment_deadline: string | null;
  contact_person: string | null;
  contact_details: string | null;
  iban: string | null;
  payment_reference: string | null;
  confidence: number;
}

const systemPrompt = `Je bent een expert in het lezen van Nederlandse schuldbrieven, incassobrieven en aanmaningen. Extraheer alle relevante informatie uit het document.

BELANGRIJKE CONTEXT:
- Nederlandse schuldbrieven komen vaak van incassobureaus, deurwaarders, of originele schuldeisers
- Bedragen worden vaak opgesplitst in: hoofdsom, incassokosten, aanmaningskosten, rente
- Let op IBAN nummers (NL + 2 cijfers + 4 letters + 10 cijfers)
- Betalingskenmerken zijn vaak lange nummers die bij de betaling vermeld moeten worden

EXTRAHEER:
1. creditor_name: Naam van incassobureau, deurwaarder of schuldeiser (de AFZENDER van de brief)
2. creditor_type: Type schuldeiser - kies uit: "energie", "telecom", "zorgverzekeraar", "bank", "retail", "overheid", "incasso", "deurwaarder", "anders"
3. case_number: Dossiernummer, zaaksnummer of referentienummer
4. original_amount: Oorspronkelijk schuldbedrag (hoofdsom) in euros
5. reminder_costs: Aanmaningskosten in euros (apart van incassokosten)
6. collection_costs: Incassokosten in euros (apart van aanmaningskosten)
7. interest_costs: Rente en overige kosten in euros
8. total_amount: TOTAAL te betalen bedrag (hoofdsom + alle kosten)
9. debt_date: Datum waarop schuld is ontstaan (format: YYYY-MM-DD)
10. payment_deadline: Uiterlijke betaaldatum (format: YYYY-MM-DD)
11. contact_person: Naam contactpersoon indien vermeld
12. contact_details: Telefoonnummer of email van schuldeiser
13. iban: IBAN nummer voor betaling
14. payment_reference: Betalingskenmerk/referentie voor overschrijving
15. confidence: Hoe zeker je bent over de extractie (0.0 - 1.0)

BELANGRIJK VOOR BEDRAGEN:
- Als je alleen een totaalbedrag ziet zonder opsplitsing, zet dit in total_amount en original_amount
- Kosten op 0 zetten als niet vermeld
- Nederlandse bedragen gebruiken komma als decimaalteken (€ 1.234,56 = 1234.56)
- Verwijder € tekens en punten als duizendtalscheiding

RETURN ALLEEN een valide JSON object in dit formaat:
{
  "creditor_name": "Incasso BV",
  "creditor_type": "incasso",
  "case_number": "2024-12345",
  "original_amount": 150.00,
  "reminder_costs": 40.00,
  "collection_costs": 65.00,
  "interest_costs": 12.50,
  "total_amount": 267.50,
  "debt_date": "2024-01-15",
  "payment_deadline": "2024-02-28",
  "contact_person": "J. de Vries",
  "contact_details": "020-1234567",
  "iban": "NL91ABNA0417164300",
  "payment_reference": "1234567890123456",
  "confidence": 0.9
}

GEEN andere tekst, ALLEEN de JSON.`;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { fileBase64, mimeType, fileUrls } = await req.json();

    // Support both single file and multiple file URLs
    const filesToProcess: { base64: string; mediaType: string }[] = [];

    if (fileBase64) {
      filesToProcess.push({ base64: fileBase64, mediaType: mimeType || 'image/jpeg' });
    }

    if (fileUrls && Array.isArray(fileUrls)) {
      // Fetch each URL and convert to base64
      for (const url of fileUrls) {
        try {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          const contentType = response.headers.get('content-type') || 'image/jpeg';
          filesToProcess.push({ base64, mediaType: contentType });
        } catch (err) {
          console.error('Failed to fetch URL:', url, err);
        }
      }
    }

    if (filesToProcess.length === 0) {
      throw new Error('No file data provided');
    }

    // Get Anthropic API key from environment
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    // Build content array with all images/documents
    const contentArray: any[] = [];

    for (const file of filesToProcess) {
      const isDocument = file.mediaType === 'application/pdf';
      contentArray.push({
        type: isDocument ? 'document' : 'image',
        source: {
          type: 'base64',
          media_type: file.mediaType,
          data: file.base64,
        },
      });
    }

    // Add the instruction text
    contentArray.push({
      type: 'text',
      text: `Analyseer ${filesToProcess.length > 1 ? 'deze pagina\'s van de' : 'deze'} Nederlandse schuldbrief/incassobrief en extraheer alle gegevens. Let vooral op:
- De naam van de schuldeiser/incassobureau (AFZENDER)
- Alle bedragen (hoofdsom, kosten, totaal)
- Betalingsgegevens (IBAN, kenmerk)
- Deadlines

Return ALLEEN een valide JSON object.`
    });

    // Use Claude Haiku for fast, cheap parsing
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022', // Claude Haiku - fast and cheap!
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
      console.error('Claude API error:', claudeData.error);
      throw new Error(claudeData.error.message || 'Claude API error');
    }

    const parsedContent = claudeData.content?.[0]?.text;

    if (!parsedContent) {
      throw new Error('Failed to parse document - no response from AI');
    }

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

    let result: ParsedDebtDocument;
    try {
      result = JSON.parse(jsonString);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr, 'Content:', jsonString);
      throw new Error('AI response was not valid JSON');
    }

    // Validate and ensure all required fields with proper types
    const validated: ParsedDebtDocument = {
      creditor_name: result.creditor_name || 'Onbekende schuldeiser',
      creditor_type: ['energie', 'telecom', 'zorgverzekeraar', 'bank', 'retail', 'overheid', 'incasso', 'deurwaarder', 'anders']
        .includes(result.creditor_type) ? result.creditor_type : 'anders',
      case_number: result.case_number || null,
      original_amount: parseAmount(result.original_amount),
      reminder_costs: parseAmount(result.reminder_costs),
      collection_costs: parseAmount(result.collection_costs),
      interest_costs: parseAmount(result.interest_costs),
      total_amount: parseAmount(result.total_amount),
      debt_date: isValidDate(result.debt_date) ? result.debt_date : null,
      payment_deadline: isValidDate(result.payment_deadline) ? result.payment_deadline : null,
      contact_person: result.contact_person || null,
      contact_details: result.contact_details || null,
      iban: isValidIBAN(result.iban) ? result.iban : null,
      payment_reference: result.payment_reference || null,
      confidence: typeof result.confidence === 'number' ? Math.min(1, Math.max(0, result.confidence)) : 0.7
    };

    // If total_amount is 0 but we have components, calculate it
    if (validated.total_amount === 0 && validated.original_amount > 0) {
      validated.total_amount = validated.original_amount +
        validated.reminder_costs +
        validated.collection_costs +
        validated.interest_costs;
    }

    // If original_amount is 0 but total_amount exists, use total as original
    if (validated.original_amount === 0 && validated.total_amount > 0) {
      validated.original_amount = validated.total_amount;
    }

    return new Response(JSON.stringify({
      status: 'success',
      output: validated
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error parsing debt document:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        details: error.message || 'Failed to parse debt document'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper functions
function parseAmount(value: any): number {
  if (typeof value === 'number') return Math.round(value * 100) / 100;
  if (typeof value === 'string') {
    // Handle Dutch number format (1.234,56 or 1234,56)
    const cleaned = value
      .replace(/[€\s]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
  }
  return 0;
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
