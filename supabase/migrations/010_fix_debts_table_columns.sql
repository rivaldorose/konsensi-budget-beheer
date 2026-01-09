-- Fix debts table by adding missing columns
-- This migration adds the missing created_at, created_date, and case_number columns

-- Add created_at if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE debts ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to debts table';
    END IF;
END $$;

-- Add created_date if it doesn't exist (for backward compatibility)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'created_date'
    ) THEN
        ALTER TABLE debts ADD COLUMN created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_date column to debts table';
    END IF;
END $$;

-- Add case_number if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'case_number'
    ) THEN
        ALTER TABLE debts ADD COLUMN case_number TEXT;
        RAISE NOTICE 'Added case_number column to debts table';
    END IF;
END $$;

-- Add index on created_at for better query performance
CREATE INDEX IF NOT EXISTS idx_debts_created_at ON debts(created_at);
