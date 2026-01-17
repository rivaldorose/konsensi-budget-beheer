import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface ParsedInvoice {
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  client_name: string;
  client_address: string | null;
  client_kvk: string | null;
  client_btw_number: string | null;
  subtotal: number; // Net amount (excl. BTW)
  vat_percentage: number; // 21, 9, or 0
  vat_amount: number;
  total_amount: number; // Gross amount (incl. BTW)
  line_items: InvoiceLineItem[];
  description: string | null;
  confidence: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { fileBase64, mimeType } = await req.json();

    if (!fileBase64) {
      throw new Error('No file data provided');
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Use GPT-4 Vision to parse the invoice
    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert at parsing Dutch invoices (facturen). Extract all relevant information from the invoice image.

IMPORTANT: Dutch invoices use BTW (VAT/Value Added Tax). Common BTW percentages are:
- 21% (standard rate for most goods/services)
- 9% (reduced rate for food, medicine, books, etc.)
- 0% (exempt or intracommunity)

For each invoice, extract:
1. invoice_number: The factuurnummer
2. invoice_date: The factuurdatum in ISO format (YYYY-MM-DD)
3. due_date: The vervaldatum/betaaldatum in ISO format if present
4. client_name: The name of the client/customer (NOT the invoice sender)
5. client_address: Client address if visible
6. client_kvk: Client KVK number if visible
7. client_btw_number: Client BTW number if visible (format: NL + 9 digits + B + 2 digits)
8. subtotal: The NETTO amount BEFORE BTW (excl. BTW) - this is the actual income
9. vat_percentage: The BTW percentage (21, 9, or 0)
10. vat_amount: The BTW amount in euros
11. total_amount: The BRUTO/total amount INCLUDING BTW
12. line_items: Array of items/services with description, quantity, unit_price, and amount
13. description: General description of the invoice work/services

Return a JSON object with this structure:
{
  "invoice_number": "2024-001",
  "invoice_date": "2024-01-15",
  "due_date": "2024-02-15",
  "client_name": "Bedrijf B.V.",
  "client_address": "Straat 1, 1234 AB Amsterdam",
  "client_kvk": "12345678",
  "client_btw_number": "NL123456789B01",
  "subtotal": 1000.00,
  "vat_percentage": 21,
  "vat_amount": 210.00,
  "total_amount": 1210.00,
  "line_items": [
    {
      "description": "Website development",
      "quantity": 10,
      "unit_price": 100.00,
      "amount": 1000.00
    }
  ],
  "description": "Website ontwikkeling januari 2024",
  "confidence": 0.95
}

CRITICAL VALIDATION:
- subtotal + vat_amount MUST equal total_amount
- vat_amount = subtotal * (vat_percentage / 100)
- If you can only see the total with BTW, calculate backwards: subtotal = total / (1 + vat_percentage/100)
- Always return numbers, not strings for amounts
- Confidence should reflect how sure you are about the extracted data (0-1)`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Parse this Dutch invoice and extract all relevant information. Focus on identifying the BTW (VAT) correctly.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${fileBase64}`
                }
              }
            ]
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 2000,
      }),
    });

    const visionData = await visionResponse.json();
    const parsedContent = visionData.choices?.[0]?.message?.content;

    if (!parsedContent) {
      throw new Error('Failed to parse invoice');
    }

    const result: ParsedInvoice = JSON.parse(parsedContent);

    // Validate and ensure all required fields
    const validated: ParsedInvoice = {
      invoice_number: result.invoice_number || 'ONBEKEND',
      invoice_date: result.invoice_date || new Date().toISOString().split('T')[0],
      due_date: result.due_date || null,
      client_name: result.client_name || 'Onbekende klant',
      client_address: result.client_address || null,
      client_kvk: result.client_kvk || null,
      client_btw_number: result.client_btw_number || null,
      subtotal: typeof result.subtotal === 'number' ? result.subtotal : parseFloat(result.subtotal) || 0,
      vat_percentage: typeof result.vat_percentage === 'number' ? result.vat_percentage : parseFloat(result.vat_percentage) || 21,
      vat_amount: typeof result.vat_amount === 'number' ? result.vat_amount : parseFloat(result.vat_amount) || 0,
      total_amount: typeof result.total_amount === 'number' ? result.total_amount : parseFloat(result.total_amount) || 0,
      line_items: Array.isArray(result.line_items) ? result.line_items : [],
      description: result.description || null,
      confidence: typeof result.confidence === 'number' ? result.confidence : 0.8
    };

    // Recalculate to ensure consistency
    if (validated.subtotal > 0 && validated.vat_percentage > 0) {
      const calculatedVat = validated.subtotal * (validated.vat_percentage / 100);
      // Only override if the calculated value is close (allow small rounding differences)
      if (Math.abs(calculatedVat - validated.vat_amount) > 1) {
        validated.vat_amount = Math.round(calculatedVat * 100) / 100;
      }
      validated.total_amount = Math.round((validated.subtotal + validated.vat_amount) * 100) / 100;
    }

    return new Response(JSON.stringify({
      success: true,
      data: validated
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error parsing invoice:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to parse invoice'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
