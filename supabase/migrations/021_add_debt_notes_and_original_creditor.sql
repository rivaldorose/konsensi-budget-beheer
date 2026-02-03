-- Create debt_notes table for storing notes on individual debts
CREATE TABLE IF NOT EXISTS debt_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_debt_notes_debt_id ON debt_notes(debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_notes_user_id ON debt_notes(user_id);

-- Enable RLS
ALTER TABLE debt_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for debt_notes
CREATE POLICY "Users can view their own debt notes"
    ON debt_notes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own debt notes"
    ON debt_notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debt notes"
    ON debt_notes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debt notes"
    ON debt_notes FOR DELETE
    USING (auth.uid() = user_id);

-- Grant permissions to authenticated and anon roles
GRANT SELECT, INSERT, UPDATE, DELETE ON debt_notes TO authenticated;
GRANT SELECT ON debt_notes TO anon;

-- Add original_creditor column to debts table (opdrachtgever)
-- Used when creditor_type is incassobureau or deurwaarder
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'original_creditor'
    ) THEN
        ALTER TABLE debts ADD COLUMN original_creditor TEXT;
    END IF;
END $$;
