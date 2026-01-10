-- Fix user_id column and RLS policies for debts table

-- First, make user_id nullable temporarily if it has data
DO $$
BEGIN
    -- Remove NOT NULL constraint if it exists
    ALTER TABLE debts ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION
    WHEN undefined_column THEN
        RAISE NOTICE 'user_id column does not exist yet';
    WHEN others THEN
        RAISE NOTICE 'Could not drop NOT NULL constraint';
END $$;

-- Ensure user_id column exists and can be set by users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE debts ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own debts" ON debts;
DROP POLICY IF EXISTS "Users can insert their own debts" ON debts;
DROP POLICY IF EXISTS "Users can update their own debts" ON debts;
DROP POLICY IF EXISTS "Users can delete their own debts" ON debts;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON debts;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON debts;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON debts;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON debts;

-- Create simple, permissive policies
CREATE POLICY "Enable insert for authenticated users"
ON debts
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users"
ON debts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Enable update for authenticated users"
ON debts
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable delete for authenticated users"
ON debts
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
