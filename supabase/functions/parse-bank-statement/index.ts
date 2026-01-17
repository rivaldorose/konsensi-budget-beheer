import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { file_data, file_type, file_name } = await req.json();

    if (!file_data) {
      throw new Error('No file data provided');
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let extractedText = '';

    // For images, use OpenAI Vision API
    if (file_type.startsWith('image/')) {
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
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Extract all text from this bank statement image. Focus on transaction details including dates, descriptions, and amounts. Return the raw text content.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${file_type};base64,${file_data}`
                  }
                }
              ]
            }
          ],
          max_tokens: 4000,
        }),
      });

      const visionData = await visionResponse.json();
      extractedText = visionData.choices?.[0]?.message?.content || '';
    }
    // For PDFs, extract text (simplified - in production you'd use a PDF parsing library)
    else if (file_type === 'application/pdf') {
      // For PDFs, we'll send it directly to GPT-4 Vision as it can handle PDFs
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
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Extract all text from this bank statement PDF. Focus on transaction details including dates, descriptions, and amounts. Return the raw text content.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${file_type};base64,${file_data}`
                  }
                }
              ]
            }
          ],
          max_tokens: 4000,
        }),
      });

      const visionData = await visionResponse.json();
      extractedText = visionData.choices?.[0]?.message?.content || '';
    }
    // For CSV files, decode directly
    else if (file_type === 'text/csv' || file_name?.endsWith('.csv')) {
      const decoded = atob(file_data);
      extractedText = decoded;
    }
    else {
      throw new Error(`Unsupported file type: ${file_type}`);
    }

    if (!extractedText) {
      throw new Error('Could not extract text from file');
    }

    // Use GPT to parse the extracted text into structured transactions
    const parseResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are a financial document parser specializing in Dutch bank statements. Parse the provided text and extract all transactions.

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
- Confidence is a number between 0 and 1 indicating parsing confidence`
          },
          {
            role: 'user',
            content: extractedText
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 4000,
      }),
    });

    const parseData = await parseResponse.json();
    const parsedContent = parseData.choices?.[0]?.message?.content;

    if (!parsedContent) {
      throw new Error('Failed to parse transactions');
    }

    const result: ParseResult = JSON.parse(parsedContent);

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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
