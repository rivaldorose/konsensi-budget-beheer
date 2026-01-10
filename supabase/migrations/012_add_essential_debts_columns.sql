-- Add all essential base columns to debts table

-- Add user_id (essential for RLS)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE debts ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add creditor_name
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'creditor_name'
    ) THEN
        ALTER TABLE debts ADD COLUMN creditor_name TEXT NOT NULL;
    END IF;
END $$;

-- Add creditor_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'creditor_type'
    ) THEN
        ALTER TABLE debts ADD COLUMN creditor_type TEXT;
    END IF;
END $$;

-- Add amount (total debt amount)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'amount'
    ) THEN
        ALTER TABLE debts ADD COLUMN amount DECIMAL(10,2) NOT NULL;
    END IF;
END $$;

-- Add amount_paid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'amount_paid'
    ) THEN
        ALTER TABLE debts ADD COLUMN amount_paid DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Add status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE debts ADD COLUMN status TEXT DEFAULT 'niet_actief';
    END IF;
END $$;

-- Add monthly_payment
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'monthly_payment'
    ) THEN
        ALTER TABLE debts ADD COLUMN monthly_payment DECIMAL(10,2);
    END IF;
END $$;

-- Add payment_plan_date
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'payment_plan_date'
    ) THEN
        ALTER TABLE debts ADD COLUMN payment_plan_date DATE;
    END IF;
END $$;

-- Add id column if not exists (should be the primary key)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'id'
    ) THEN
        ALTER TABLE debts ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
    END IF;
END $$;

-- Add updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'debts'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE debts ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_origin_date ON debts(origin_date);
