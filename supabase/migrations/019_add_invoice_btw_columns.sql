-- Migration: Add invoice/BTW columns for ZZP freelancers
-- This enables scanning invoices with VAT (BTW) support

-- Add invoice-related columns to income table
ALTER TABLE income
ADD COLUMN IF NOT EXISTS is_invoice boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS invoice_number text,
ADD COLUMN IF NOT EXISTS client_name text,
ADD COLUMN IF NOT EXISTS gross_amount decimal(10, 2),
ADD COLUMN IF NOT EXISTS vat_percentage decimal(5, 2),
ADD COLUMN IF NOT EXISTS vat_amount decimal(10, 2),
ADD COLUMN IF NOT EXISTS file_url text;

-- Create invoices table for detailed invoice tracking
CREATE TABLE IF NOT EXISTS invoices (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    income_id uuid REFERENCES income(id) ON DELETE SET NULL,

    -- Invoice details
    invoice_number text NOT NULL,
    invoice_date date NOT NULL,
    due_date date,
    client_name text NOT NULL,
    client_address text,
    client_kvk text,
    client_btw_number text,

    -- Amounts
    subtotal decimal(10, 2) NOT NULL, -- Net amount (excl. BTW)
    vat_percentage decimal(5, 2) NOT NULL DEFAULT 21.00,
    vat_amount decimal(10, 2) NOT NULL,
    total_amount decimal(10, 2) NOT NULL, -- Gross amount (incl. BTW)

    -- Payment status
    status text DEFAULT 'concept' CHECK (status IN ('concept', 'verzonden', 'betaald', 'verlopen')),
    payment_date date,

    -- File reference
    file_url text,

    -- Description/notes
    description text,
    line_items jsonb, -- Array of {description, quantity, unit_price, amount}

    -- Metadata
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_income_is_invoice ON income(is_invoice) WHERE is_invoice = true;

-- Add pot_type to pots table for BTW Reserve potjes
ALTER TABLE pots
ADD COLUMN IF NOT EXISTS pot_type text DEFAULT 'savings' CHECK (pot_type IN ('savings', 'reserve', 'btw_reserve', 'emergency'));

-- Enable RLS on invoices table
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoices
CREATE POLICY "Users can view their own invoices"
ON invoices FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices"
ON invoices FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
ON invoices FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
ON invoices FOR DELETE
USING (auth.uid() = user_id);

-- Comment explaining the BTW flow
COMMENT ON TABLE invoices IS 'ZZP/Freelancer invoices with VAT (BTW) tracking. When an invoice is scanned, the net amount goes to income, the VAT amount should be reserved for quarterly tax payments.';
