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

interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string | null;
  counterparty: string | null;
  confidence: number;
}

interface ParseResult {
  transactions: Transaction[];
  total_income: number;
  total_expenses: number;
  confidence: number;
}

const systemPrompt = `You are a financial document parser specializing in Dutch bank statements. Parse the provided bank statement and extract all transactions.

For each transaction, determine:
1. date: The transaction date in ISO format (YYYY-MM-DD)
2. description: The transaction description/narrative
3. amount: The absolute amount as a number (no currency symbols)
4. type: "income" for money received, "expense" for money spent
5. category: Categorize into one of: "Salaris", "Huur", "Boodschappen", "Energie", "Verzekering", "Abonnement", "Eten & Drinken", "Transport", "Zorg", "Overig"
6. counterparty: The other party in the transaction if identifiable

Return a JSON object with this exact structure:
{
  "transactions": [
    {
      "date": "2024-01-15",
      "description": "Albert Heijn payment",
      "amount": 45.67,
      "type": "expense",
      "category": "Boodschappen",
      "counterparty": "Albert Heijn",
      "confidence": 0.95
    }
  ],
  "total_income": 2500.00,
  "total_expenses": 1200.00,
  "confidence": 0.9
}

Important:
- All amounts should be positive numbers
- The type field determines if it's income or expense
- Calculate total_income as sum of all income transactions
- Calculate total_expenses as sum of all expense transactions
- Confidence is a number between 0 and 1 indicating parsing confidence
- ONLY return the JSON object, no other text`;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }

  try {
    const { file_data, file_type, file_name, files } = await req.json();

    // Get Anthropic API key from environment
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    // Build message content - support both single file and multiple files
    let messageContent: any[] = [];

    // Handle multiple files (new format)
    if (files && Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        const fType = file.file_type || file.type || 'image/jpeg';
        const fData = file.file_data || file.data;
        const fName = file.file_name || file.name || '';

        if (!fData) continue;

        if (fType === 'text/csv' || fName?.endsWith('.csv')) {
          // For CSV, decode and send as text
          const decoded = atob(fData);
          messageContent.push({
            type: 'text',
            text: `Bank statement CSV (${fName}):\n\n${decoded}`
          });
        } else if (fType === 'application/pdf') {
          messageContent.push({
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: fData,
            },
          });
        } else {
          // Images
          messageContent.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: fType,
              data: fData,
            },
          });
        }
      }
    }
    // Handle single file (legacy format)
    else if (file_data) {
      if (file_type === 'text/csv' || file_name?.endsWith('.csv')) {
        const decoded = atob(file_data);
        messageContent.push({
          type: 'text',
          text: `Parse this bank statement CSV and extract all transactions:\n\n${decoded}`
        });
      } else if (file_type === 'application/pdf') {
        messageContent.push({
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: file_data,
          },
        });
      } else {
        messageContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: file_type || 'image/jpeg',
            data: file_data,
          },
        });
      }
    } else {
      throw new Error('No file data provided');
    }

    // Add instruction text
    messageContent.push({
      type: 'text',
      text: `Analyseer ${messageContent.length > 1 ? 'deze bankafschriften' : 'dit bankafschrift'} en extraheer ALLE transacties. Return ALLEEN een valide JSON object.`
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
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: messageContent
          }
        ],
        system: systemPrompt,
      }),
    });

    const claudeData = await response.json();

    if (claudeData.error) {
      throw new Error(claudeData.error.message || 'Claude API error');
    }

    const parsedContent = claudeData.content?.[0]?.text;

    if (!parsedContent) {
      throw new Error('Failed to parse bank statement');
    }

    // Extract JSON from response (Claude might wrap it in markdown code blocks)
    let jsonString = parsedContent;
    const jsonMatch = parsedContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonString = jsonMatch[1].trim();
    }

    const result: ParseResult = JSON.parse(jsonString);

    // Validate and clean the result
    if (!result.transactions || !Array.isArray(result.transactions)) {
      throw new Error('Invalid transaction data');
    }

    // Ensure all required fields are present
    result.transactions = result.transactions.map(t => ({
      date: t.date || new Date().toISOString().split('T')[0],
      description: t.description || 'Onbekende transactie',
      amount: typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0,
      type: t.type === 'income' ? 'income' : 'expense',
      category: t.category || null,
      counterparty: t.counterparty || null,
      confidence: typeof t.confidence === 'number' ? t.confidence : 0.8
    }));

    // Recalculate totals to ensure accuracy
    result.total_income = result.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    result.total_expenses = result.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    result.confidence = result.confidence || 0.85;

    return new Response(JSON.stringify(result), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error parsing bank statement:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to parse bank statement',
        transactions: [],
        total_income: 0,
        total_expenses: 0,
        confidence: 0
      }),
      {
        status: 400,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      }
    );
  }
});
