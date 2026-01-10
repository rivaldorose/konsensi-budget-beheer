-- ============================================
-- ADD user_id COLUMNS TO ALL TABLES
-- ============================================
-- This migration adds user_id columns to all tables that need them
-- and migrates data from created_by columns where they exist.
-- This is required for RLS policies to work correctly.
-- ============================================

-- Function to safely add user_id column and migrate from created_by
CREATE OR REPLACE FUNCTION add_user_id_column(p_table_name TEXT)
RETURNS void AS $$
DECLARE
  has_user_id BOOLEAN;
  has_created_by BOOLEAN;
BEGIN
  -- Check if user_id column already exists
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

  -- If user_id doesn't exist, add it
  IF NOT has_user_id THEN
    RAISE NOTICE 'Adding user_id column to %', p_table_name;
    EXECUTE format('ALTER TABLE %I ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE', p_table_name);

    -- If created_by exists (email-based), try to migrate data
    IF has_created_by THEN
      RAISE NOTICE 'Migrating data from created_by to user_id for %', p_table_name;

      -- Update user_id from created_by email by joining with users table
      EXECUTE format('
        UPDATE %I t
        SET user_id = u.id
        FROM users u
        WHERE t.created_by = u.email
        AND t.user_id IS NULL
      ', p_table_name);

      -- For any remaining rows without user_id, try to match with auth.users
      EXECUTE format('
        UPDATE %I t
        SET user_id = au.id
        FROM auth.users au
        WHERE t.created_by = au.email
        AND t.user_id IS NULL
      ', p_table_name);
    END IF;

    -- Create index on user_id for performance
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_user_id ON %I(user_id)', p_table_name, p_table_name);
  ELSE
    RAISE NOTICE 'Table % already has user_id column', p_table_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Add user_id to all financial tables
-- ============================================

DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'income',
    'expenses',
    'debts',
    'debt_payments',
    'monthly_costs',
    'transactions',
    'pots',
    'payment_plans',
    'windfall_events',
    'monthly_reports',
    'vtbl_calculations',
    'payment_agreements',
    'privacy_settings',
    'notification_preferences',
    'security_settings',
    'payment_settings',
    'help_requests',
    'notifications',
    'creditors',
    'bank_connections',
    'bank_transactions',
    'monthly_checks',
    'payment_statuses',
    'loans',
    'arrangement_progress',
    'vtbl_settings',
    'payment_plan_proposals',
    'adempauze_actions',
    'debt_correspondences',
    'debt_status_history',
    'payment_documents',
    'debt_strategies',
    'debt_payoff_schedules',
    'support_messages',
    'research_questions',
    'user_responses',
    'work_days',
    'wishlist_items',
    'payslips',
    'variable_income_entries',
    'notification_rules'
  ];
  tbl_name TEXT;
  table_exists BOOLEAN;
BEGIN
  FOREACH tbl_name IN ARRAY tables
  LOOP
    -- Check if table exists
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = tbl_name
    ) INTO table_exists;

    IF table_exists THEN
      PERFORM add_user_id_column(tbl_name);
    ELSE
      RAISE NOTICE 'Table % does not exist, skipping', tbl_name;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- Ensure users table has proper structure
-- ============================================

-- The users table should use 'id' as the user identifier (linked to auth.users)
-- No need to add user_id to users table as it references itself via 'id'

-- ============================================
-- Clean up function
-- ============================================

DROP FUNCTION IF EXISTS add_user_id_column(TEXT);

-- ============================================
-- Re-apply RLS policies after adding user_id columns
-- ============================================

-- The policies from migration 006 will now work because user_id columns exist
-- No need to recreate them - they should already exist from migration 006
