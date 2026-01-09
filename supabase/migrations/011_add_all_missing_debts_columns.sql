-- Add all missing columns to debts table based on the wizard data
-- This ensures all fields from the DebtWizard can be saved

-- Add collection_costs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'collection_costs'
    ) THEN
        ALTER TABLE debts ADD COLUMN collection_costs DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Add interest_amount
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'interest_amount'
    ) THEN
        ALTER TABLE debts ADD COLUMN interest_amount DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Add principal_amount
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'principal_amount'
    ) THEN
        ALTER TABLE debts ADD COLUMN principal_amount DECIMAL(10,2);
    END IF;
END $$;

-- Add is_personal_loan
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'is_personal_loan'
    ) THEN
        ALTER TABLE debts ADD COLUMN is_personal_loan BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add loan_relationship
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'loan_relationship'
    ) THEN
        ALTER TABLE debts ADD COLUMN loan_relationship TEXT;
    END IF;
END $$;

-- Add loan_relationship_description
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'loan_relationship_description'
    ) THEN
        ALTER TABLE debts ADD COLUMN loan_relationship_description TEXT;
    END IF;
END $$;

-- Add payment_account_name
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'payment_account_name'
    ) THEN
        ALTER TABLE debts ADD COLUMN payment_account_name TEXT;
    END IF;
END $$;

-- Add payment_iban
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'payment_iban'
    ) THEN
        ALTER TABLE debts ADD COLUMN payment_iban TEXT;
    END IF;
END $$;

-- Add payment_reference
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'payment_reference'
    ) THEN
        ALTER TABLE debts ADD COLUMN payment_reference TEXT;
    END IF;
END $$;

-- Add repayment_amount
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'repayment_amount'
    ) THEN
        ALTER TABLE debts ADD COLUMN repayment_amount DECIMAL(10,2);
    END IF;
END $$;

-- Add repayment_frequency
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'repayment_frequency'
    ) THEN
        ALTER TABLE debts ADD COLUMN repayment_frequency TEXT;
    END IF;
END $$;

-- Add origin_date
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'origin_date'
    ) THEN
        ALTER TABLE debts ADD COLUMN origin_date DATE;
    END IF;
END $$;

-- Add notes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE debts ADD COLUMN notes TEXT;
    END IF;
END $$;
