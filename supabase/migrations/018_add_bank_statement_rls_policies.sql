-- Migration: Add RLS policies for bank statement scanning tables
-- This enables Row Level Security on scanned_bank_statements and bank_statement_transactions

-- Enable RLS on scanned_bank_statements table
ALTER TABLE scanned_bank_statements ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own scanned bank statements
CREATE POLICY "Users can view their own scanned bank statements"
ON scanned_bank_statements FOR SELECT
USING (auth.uid() = user_id);

-- Policy for users to insert their own scanned bank statements
CREATE POLICY "Users can insert their own scanned bank statements"
ON scanned_bank_statements FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own scanned bank statements
CREATE POLICY "Users can update their own scanned bank statements"
ON scanned_bank_statements FOR UPDATE
USING (auth.uid() = user_id);

-- Policy for users to delete their own scanned bank statements
CREATE POLICY "Users can delete their own scanned bank statements"
ON scanned_bank_statements FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS on bank_statement_transactions table
ALTER TABLE bank_statement_transactions ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own bank statement transactions
CREATE POLICY "Users can view their own bank statement transactions"
ON bank_statement_transactions FOR SELECT
USING (auth.uid() = user_id);

-- Policy for users to insert their own bank statement transactions
CREATE POLICY "Users can insert their own bank statement transactions"
ON bank_statement_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own bank statement transactions
CREATE POLICY "Users can update their own bank statement transactions"
ON bank_statement_transactions FOR UPDATE
USING (auth.uid() = user_id);

-- Policy for users to delete their own bank statement transactions
CREATE POLICY "Users can delete their own bank statement transactions"
ON bank_statement_transactions FOR DELETE
USING (auth.uid() = user_id);
