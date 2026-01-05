-- ============================================
-- ADD USER_ID COLUMNS TO ALL TABLES
-- ============================================
-- This migration adds user_id UUID columns to all tables that don't have them
-- and migrates data from created_by (email) to user_id (UUID)
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- HELPER FUNCTION: Add user_id column and migrate data
-- ============================================
CREATE OR REPLACE FUNCTION add_user_id_column_and_migrate(
  p_table_name TEXT
)
RETURNS void AS $$
DECLARE
  has_user_id BOOLEAN;
  has_created_by BOOLEAN;
BEGIN
  -- Check if table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = p_table_name
  ) THEN
    RAISE NOTICE 'Table % does not exist, skipping', p_table_name;
    RETURN;
  END IF;

  -- Check if user_id column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = p_table_name 
    AND column_name = 'user_id'
  ) INTO has_user_id;

  -- Check if created_by column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = p_table_name 
    AND column_name = 'created_by'
  ) INTO has_created_by;

  -- Add user_id column if it doesn't exist
  IF NOT has_user_id THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE', p_table_name);
    RAISE NOTICE 'Added user_id column to %', p_table_name;
  END IF;

  -- Migrate data from created_by to user_id if created_by exists
  IF has_created_by AND has_user_id THEN
    EXECUTE format('
      UPDATE %I 
      SET user_id = (
        SELECT id FROM auth.users 
        WHERE email = %I.created_by 
        LIMIT 1
      )
      WHERE user_id IS NULL 
      AND created_by IS NOT NULL
    ', p_table_name, p_table_name);
    
    RAISE NOTICE 'Migrated data from created_by to user_id for %', p_table_name;
  END IF;

  -- Make user_id NOT NULL if all rows have user_id (after migration)
  IF has_user_id THEN
    EXECUTE format('
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM %I WHERE user_id IS NULL) THEN
          ALTER TABLE %I ALTER COLUMN user_id SET NOT NULL;
        END IF;
      END $$;
    ', p_table_name, p_table_name);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ADD USER_ID TO ALL TABLES
-- ============================================

-- Income table
SELECT add_user_id_column_and_migrate('income');

-- Expenses table
SELECT add_user_id_column_and_migrate('expenses');

-- Debts table
SELECT add_user_id_column_and_migrate('debts');

-- Debt_payments table
SELECT add_user_id_column_and_migrate('debt_payments');

-- Monthly_costs table
SELECT add_user_id_column_and_migrate('monthly_costs');

-- Transactions table
SELECT add_user_id_column_and_migrate('transactions');

-- Pots table
SELECT add_user_id_column_and_migrate('pots');

-- Payment_plans table
SELECT add_user_id_column_and_migrate('payment_plans');

-- Windfall_events table
SELECT add_user_id_column_and_migrate('windfall_events');

-- Monthly_reports table
SELECT add_user_id_column_and_migrate('monthly_reports');

-- Loans table
SELECT add_user_id_column_and_migrate('loans');

-- Variable_income_entries table
SELECT add_user_id_column_and_migrate('variable_income_entries');

-- Payslips table
SELECT add_user_id_column_and_migrate('payslips');

-- Work_days table
SELECT add_user_id_column_and_migrate('work_days');

-- Debt_strategies table
SELECT add_user_id_column_and_migrate('debt_strategies');

-- Debt_payoff_schedules table
SELECT add_user_id_column_and_migrate('debt_payoff_schedules');

-- Debt_correspondences table
SELECT add_user_id_column_and_migrate('debt_correspondences');

-- Payment_agreements table
SELECT add_user_id_column_and_migrate('payment_agreements');

-- Payment_plan_proposals table
SELECT add_user_id_column_and_migrate('payment_plan_proposals');

-- Arrangement_progress table
SELECT add_user_id_column_and_migrate('arrangement_progress');

-- Payment_documents table
SELECT add_user_id_column_and_migrate('payment_documents');

-- Privacy_settings table
SELECT add_user_id_column_and_migrate('privacy_settings');

-- Security_settings table
SELECT add_user_id_column_and_migrate('security_settings');

-- Payment_settings table
SELECT add_user_id_column_and_migrate('payment_settings');

-- Notification_preferences table
SELECT add_user_id_column_and_migrate('notification_preferences');

-- Notification_rules table
SELECT add_user_id_column_and_migrate('notification_rules');

-- Vtbl_settings table
SELECT add_user_id_column_and_migrate('vtbl_settings');

-- Vtbl_calculations table
SELECT add_user_id_column_and_migrate('vtbl_calculations');

-- Help_requests table
SELECT add_user_id_column_and_migrate('help_requests');

-- Support_messages table
SELECT add_user_id_column_and_migrate('support_messages');

-- Wishlist_items table
SELECT add_user_id_column_and_migrate('wishlist_items');

-- Goals table
SELECT add_user_id_column_and_migrate('goals');

-- Adempauze_actions table
SELECT add_user_id_column_and_migrate('adempauze_actions');

-- Bank_connections table
SELECT add_user_id_column_and_migrate('bank_connections');

-- Bank_transactions table
SELECT add_user_id_column_and_migrate('bank_transactions');

-- User_progress table
SELECT add_user_id_column_and_migrate('user_progress');

-- ============================================
-- CREATE INDEXES FOR USER_ID COLUMNS
-- ============================================
DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name NOT IN ('schema_migrations', 'supabase_migrations', 'users', 'achievements', 'challenges', 'daily_motivations', 'faqs', 'translations')
  LOOP
    -- Check if table has user_id column
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = table_record.table_name 
      AND column_name = 'user_id'
    ) THEN
      -- Create index if it doesn't exist
      BEGIN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_user_id ON %I(user_id)', 
          table_record.table_name, table_record.table_name);
        RAISE NOTICE 'Created index for %I.user_id', table_record.table_name;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create index for %I: %', table_record.table_name, SQLERRM;
      END;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- CLEANUP
-- ============================================
DROP FUNCTION IF EXISTS add_user_id_column_and_migrate(TEXT);

