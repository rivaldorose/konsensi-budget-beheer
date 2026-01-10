-- Add missing columns to income table
-- These columns are required for the onboarding flow

DO $$
BEGIN
  -- Add category column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'income'
    AND column_name = 'category'
  ) THEN
    ALTER TABLE income ADD COLUMN category TEXT DEFAULT 'salaris';
    RAISE NOTICE 'Added category column to income table';
  END IF;

  -- Add description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'income'
    AND column_name = 'description'
  ) THEN
    ALTER TABLE income ADD COLUMN description TEXT;
    RAISE NOTICE 'Added description column to income table';
  END IF;

  -- Add frequency column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'income'
    AND column_name = 'frequency'
  ) THEN
    ALTER TABLE income ADD COLUMN frequency TEXT DEFAULT 'monthly';
    RAISE NOTICE 'Added frequency column to income table';
  END IF;

  -- Add day_of_month column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'income'
    AND column_name = 'day_of_month'
  ) THEN
    ALTER TABLE income ADD COLUMN day_of_month INTEGER DEFAULT 25;
    RAISE NOTICE 'Added day_of_month column to income table';
  END IF;

  -- Add income_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'income'
    AND column_name = 'income_type'
  ) THEN
    ALTER TABLE income ADD COLUMN income_type TEXT DEFAULT 'vast';
    RAISE NOTICE 'Added income_type column to income table';
  END IF;

  -- Add is_active column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'income'
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE income ADD COLUMN is_active BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added is_active column to income table';
  END IF;

  -- Add start_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'income'
    AND column_name = 'start_date'
  ) THEN
    ALTER TABLE income ADD COLUMN start_date DATE DEFAULT CURRENT_DATE;
    RAISE NOTICE 'Added start_date column to income table';
  END IF;

  -- Add amount column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'income'
    AND column_name = 'amount'
  ) THEN
    ALTER TABLE income ADD COLUMN amount DECIMAL(10, 2) NOT NULL DEFAULT 0;
    RAISE NOTICE 'Added amount column to income table';
  END IF;

END $$;

-- Create index on category for better query performance
CREATE INDEX IF NOT EXISTS idx_income_category ON income(category);

-- Create index on is_active for filtering active income
CREATE INDEX IF NOT EXISTS idx_income_is_active ON income(is_active);

-- Create index on start_date for date-based queries
CREATE INDEX IF NOT EXISTS idx_income_start_date ON income(start_date);
