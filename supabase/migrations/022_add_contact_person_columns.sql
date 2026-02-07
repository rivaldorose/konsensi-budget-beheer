-- Add contact_person_name column to debts table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'contact_person_name'
    ) THEN
        ALTER TABLE debts ADD COLUMN contact_person_name TEXT;
    END IF;
END $$;

-- Add contact_person_details column to debts table (for phone/email)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'contact_person_details'
    ) THEN
        ALTER TABLE debts ADD COLUMN contact_person_details TEXT;
    END IF;
END $$;
