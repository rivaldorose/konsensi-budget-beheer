-- ============================================
-- COMPLETE RLS POLICIES MIGRATION
-- ============================================
-- This migration creates RLS policies for ALL tables in the Konsensi app
-- All policies follow the principle: users can ONLY access their own data
-- 
-- IMPORTANT: Run this migration AFTER all table creation migrations
-- This ensures all tables exist before policies are created
-- ============================================

-- Enable pgcrypto extension for gen_random_uuid() if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- HELPER FUNCTION: Create standard RLS policies for a table
-- Automatically detects user_id column or uses provided column name
-- ============================================
CREATE OR REPLACE FUNCTION create_standard_rls_policies(
  p_table_name TEXT,
  p_user_id_column TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  actual_user_column TEXT;
  column_exists BOOLEAN;
BEGIN
  -- Enable RLS
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', p_table_name);
  
  -- Auto-detect user column if not provided
  IF p_user_id_column IS NULL THEN
    -- Check for common user column names
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = p_table_name 
      AND column_name = 'user_id'
    ) INTO column_exists;
    
    IF column_exists THEN
      actual_user_column := 'user_id';
    ELSE
      -- Check for 'id' column (for users table)
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = p_table_name 
        AND column_name = 'id'
      ) INTO column_exists;
      
      IF column_exists AND p_table_name = 'users' THEN
        actual_user_column := 'id';
      ELSE
        -- Try to find a column that references auth.users
        SELECT column_name INTO actual_user_column
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = p_table_name
        AND column_name IN ('user_id', 'created_by', 'owner_id')
        LIMIT 1;
        
        IF actual_user_column IS NULL THEN
          RAISE EXCEPTION 'Table % does not have a user_id, id, created_by, or owner_id column', p_table_name;
        END IF;
      END IF;
    END IF;
  ELSE
    -- Verify the provided column exists
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = p_table_name 
      AND column_name = p_user_id_column
    ) INTO column_exists;
    
    IF NOT column_exists THEN
      -- Try to auto-detect instead of failing
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = p_table_name 
        AND column_name = 'user_id'
      ) INTO column_exists;
      
      IF column_exists THEN
        actual_user_column := 'user_id';
        RAISE NOTICE 'Column % does not exist in table %, using user_id instead', p_user_id_column, p_table_name;
      ELSE
        RAISE EXCEPTION 'Column % does not exist in table % and no user_id column found', p_user_id_column, p_table_name;
      END IF;
    ELSE
      actual_user_column := p_user_id_column;
    END IF;
  END IF;
  
  -- Drop existing policies if they exist
  EXECUTE format('DROP POLICY IF EXISTS "Users can read own %I" ON %I', p_table_name, p_table_name);
  EXECUTE format('DROP POLICY IF EXISTS "Users can insert own %I" ON %I', p_table_name, p_table_name);
  EXECUTE format('DROP POLICY IF EXISTS "Users can update own %I" ON %I', p_table_name, p_table_name);
  EXECUTE format('DROP POLICY IF EXISTS "Users can delete own %I" ON %I', p_table_name, p_table_name);
  
  -- SELECT policy
  EXECUTE format(
    'CREATE POLICY "Users can read own %I" ON %I FOR SELECT USING (auth.uid() = %I)',
    p_table_name, p_table_name, actual_user_column
  );
  
  -- INSERT policy
  EXECUTE format(
    'CREATE POLICY "Users can insert own %I" ON %I FOR INSERT WITH CHECK (auth.uid() = %I)',
    p_table_name, p_table_name, actual_user_column
  );
  
  -- UPDATE policy
  EXECUTE format(
    'CREATE POLICY "Users can update own %I" ON %I FOR UPDATE USING (auth.uid() = %I) WITH CHECK (auth.uid() = %I)',
    p_table_name, p_table_name, actual_user_column, actual_user_column
  );
  
  -- DELETE policy
  EXECUTE format(
    'CREATE POLICY "Users can delete own %I" ON %I FOR DELETE USING (auth.uid() = %I)',
    p_table_name, p_table_name, actual_user_column
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FINANCIAL DATA TABLES (user_id column)
-- ============================================

-- Income table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'income') THEN
    PERFORM create_standard_rls_policies('income', 'user_id');
  END IF;
END $$;

-- Expenses table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
    PERFORM create_standard_rls_policies('expenses', 'user_id');
  END IF;
END $$;

-- Debts table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'debts') THEN
    PERFORM create_standard_rls_policies('debts', 'user_id');
  END IF;
END $$;

-- Debt_payments table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'debt_payments') THEN
    PERFORM create_standard_rls_policies('debt_payments', 'user_id');
  END IF;
END $$;

-- Monthly_costs table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'monthly_costs') THEN
    PERFORM create_standard_rls_policies('monthly_costs', 'user_id');
  END IF;
END $$;

-- Transactions table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
    PERFORM create_standard_rls_policies('transactions', 'user_id');
  END IF;
END $$;

-- Pots table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pots') THEN
    PERFORM create_standard_rls_policies('pots', 'user_id');
  END IF;
END $$;

-- Payment_plans table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_plans') THEN
    PERFORM create_standard_rls_policies('payment_plans', 'user_id');
  END IF;
END $$;

-- Windfall_events table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'windfall_events') THEN
    PERFORM create_standard_rls_policies('windfall_events', 'user_id');
  END IF;
END $$;

-- Monthly_reports table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'monthly_reports') THEN
    PERFORM create_standard_rls_policies('monthly_reports', 'user_id');
  END IF;
END $$;

-- Loans table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'loans') THEN
    PERFORM create_standard_rls_policies('loans', 'user_id');
  END IF;
END $$;

-- Variable_income_entries table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'variable_income_entries') THEN
    PERFORM create_standard_rls_policies('variable_income_entries', 'user_id');
  END IF;
END $$;

-- Payslips table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payslips') THEN
    PERFORM create_standard_rls_policies('payslips', 'user_id');
  END IF;
END $$;

-- Work_days table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'work_days') THEN
    PERFORM create_standard_rls_policies('work_days', 'user_id');
  END IF;
END $$;

-- ============================================
-- DEBT MANAGEMENT TABLES (user_id column)
-- ============================================

-- Debt_strategies table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'debt_strategies') THEN
    PERFORM create_standard_rls_policies('debt_strategies', 'user_id');
  END IF;
END $$;

-- Debt_payoff_schedules table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'debt_payoff_schedules') THEN
    PERFORM create_standard_rls_policies('debt_payoff_schedules', 'user_id');
  END IF;
END $$;

-- Debt_correspondences table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'debt_correspondences') THEN
    PERFORM create_standard_rls_policies('debt_correspondences', 'user_id');
  END IF;
END $$;

-- Debt_status_history table
-- Check what column it uses for user ownership (might be debt_id or user_id)
DO $$
DECLARE
  has_user_id BOOLEAN;
  has_debt_id BOOLEAN;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'debt_status_history') THEN
    -- Check if table has user_id column
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'debt_status_history' 
      AND column_name = 'user_id'
    ) INTO has_user_id;
    
    -- Check if table has debt_id column (might reference debts table which has user_id)
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'debt_status_history' 
      AND column_name = 'debt_id'
    ) INTO has_debt_id;
    
    ALTER TABLE debt_status_history ENABLE ROW LEVEL SECURITY;
    
    IF has_user_id THEN
      -- Has direct user_id column
      PERFORM create_standard_rls_policies('debt_status_history', 'user_id');
    ELSIF has_debt_id AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'debts') THEN
      -- Use debt_id to join with debts table to get user_id
      DROP POLICY IF EXISTS "Users can read own debt_status_history" ON debt_status_history;
      CREATE POLICY "Users can read own debt_status_history" ON debt_status_history
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM debts 
            WHERE debts.id = debt_status_history.debt_id 
            AND debts.user_id = auth.uid()
          )
        );
      
      DROP POLICY IF EXISTS "Users can insert own debt_status_history" ON debt_status_history;
      CREATE POLICY "Users can insert own debt_status_history" ON debt_status_history
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM debts 
            WHERE debts.id = debt_status_history.debt_id 
            AND debts.user_id = auth.uid()
          )
        );
      
      DROP POLICY IF EXISTS "Users can update own debt_status_history" ON debt_status_history;
      CREATE POLICY "Users can update own debt_status_history" ON debt_status_history
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM debts 
            WHERE debts.id = debt_status_history.debt_id 
            AND debts.user_id = auth.uid()
          )
        ) WITH CHECK (
          EXISTS (
            SELECT 1 FROM debts 
            WHERE debts.id = debt_status_history.debt_id 
            AND debts.user_id = auth.uid()
          )
        );
      
      DROP POLICY IF EXISTS "Users can delete own debt_status_history" ON debt_status_history;
      CREATE POLICY "Users can delete own debt_status_history" ON debt_status_history
        FOR DELETE USING (
          EXISTS (
            SELECT 1 FROM debts 
            WHERE debts.id = debt_status_history.debt_id 
            AND debts.user_id = auth.uid()
          )
        );
    ELSE
      -- Skip this table if we can't determine ownership
      RAISE NOTICE 'Skipping debt_status_history: no user_id or debt_id column found';
    END IF;
  END IF;
END $$;

-- Payment_agreements table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_agreements') THEN
    PERFORM create_standard_rls_policies('payment_agreements', 'user_id');
  END IF;
END $$;

-- Payment_plan_proposals table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_plan_proposals') THEN
    PERFORM create_standard_rls_policies('payment_plan_proposals', 'user_id');
  END IF;
END $$;

-- Arrangement_progress table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'arrangement_progress') THEN
    PERFORM create_standard_rls_policies('arrangement_progress', 'user_id');
  END IF;
END $$;

-- Payment_documents table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_documents') THEN
    PERFORM create_standard_rls_policies('payment_documents', 'user_id');
  END IF;
END $$;

-- ============================================
-- GAMIFICATION TABLES (user_id column)
-- Already have policies in 002_gamification.sql, but ensure they exist
-- ============================================

-- user_levels - already has policies, but ensure RLS is enabled
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_levels') THEN
    ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
    -- Policies already exist in 002_gamification.sql
  END IF;
END $$;

-- user_badges - already has policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_badges') THEN
    ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- user_achievements - already has policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_achievements') THEN
    PERFORM create_standard_rls_policies('user_achievements', 'user_id');
  END IF;
END $$;

-- week_goals - already has policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'week_goals') THEN
    ALTER TABLE week_goals ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- user_progress table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_progress') THEN
    PERFORM create_standard_rls_policies('user_progress', 'user_id');
  END IF;
END $$;

-- ============================================
-- SETTINGS TABLES (user_id column)
-- ============================================

-- Privacy_settings table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'privacy_settings') THEN
    PERFORM create_standard_rls_policies('privacy_settings', 'user_id');
  END IF;
END $$;

-- Security_settings table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'security_settings') THEN
    PERFORM create_standard_rls_policies('security_settings', 'user_id');
  END IF;
END $$;

-- Payment_settings table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_settings') THEN
    PERFORM create_standard_rls_policies('payment_settings', 'user_id');
  END IF;
END $$;

-- Notification_preferences table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notification_preferences') THEN
    PERFORM create_standard_rls_policies('notification_preferences', 'user_id');
  END IF;
END $$;

-- Notification_rules table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notification_rules') THEN
    PERFORM create_standard_rls_policies('notification_rules', 'user_id');
  END IF;
END $$;

-- Vtbl_settings table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vtbl_settings') THEN
    PERFORM create_standard_rls_policies('vtbl_settings', 'user_id');
  END IF;
END $$;

-- Vtbl_calculations table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vtbl_calculations') THEN
    PERFORM create_standard_rls_policies('vtbl_calculations', 'user_id');
  END IF;
END $$;

-- ============================================
-- SUPPORT & HELP TABLES (user_id column)
-- ============================================

-- Help_requests table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'help_requests') THEN
    PERFORM create_standard_rls_policies('help_requests', 'user_id');
  END IF;
END $$;

-- Support_messages table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'support_messages') THEN
    PERFORM create_standard_rls_policies('support_messages', 'user_id');
  END IF;
END $$;

-- Research_questions table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'research_questions') THEN
    PERFORM create_standard_rls_policies('research_questions', 'user_id');
  END IF;
END $$;

-- User_responses table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_responses') THEN
    PERFORM create_standard_rls_policies('user_responses', 'user_id');
  END IF;
END $$;

-- ============================================
-- WISHLIST & GOALS (user_id column)
-- ============================================

-- Wishlist_items table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wishlist_items') THEN
    PERFORM create_standard_rls_policies('wishlist_items', 'user_id');
  END IF;
END $$;

-- Goals table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'goals') THEN
    PERFORM create_standard_rls_policies('goals', 'user_id');
  END IF;
END $$;

-- ============================================
-- ADEMPAUZE TABLES (user_id column)
-- ============================================

-- Adempauze_actions table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'adempauze_actions') THEN
    PERFORM create_standard_rls_policies('adempauze_actions', 'user_id');
  END IF;
END $$;

-- ============================================
-- BANK INTEGRATION TABLES (user_id column)
-- ============================================

-- Bank_connections table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bank_connections') THEN
    PERFORM create_standard_rls_policies('bank_connections', 'user_id');
  END IF;
END $$;

-- Bank_transactions table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bank_transactions') THEN
    PERFORM create_standard_rls_policies('bank_transactions', 'user_id');
  END IF;
END $$;

-- ============================================
-- SPECIAL CASES
-- ============================================

-- USERS table (uses 'id' instead of 'user_id')
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
    
    -- SELECT policy
    CREATE POLICY "Users can view their own profile" ON public.users
      FOR SELECT USING (auth.uid() = id);
    
    -- UPDATE policy
    CREATE POLICY "Users can update their own profile" ON public.users
      FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
    
    -- INSERT policy
    CREATE POLICY "Users can insert their own profile" ON public.users
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- NOTIFICATIONS table (already has policies in 005, but ensure they exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    -- Policies already exist in 005_notifications_monthly_checks_payment_statuses.sql
  END IF;
END $$;

-- MONTHLY_CHECKS table (already has policies in 005)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'monthly_checks') THEN
    ALTER TABLE public.monthly_checks ENABLE ROW LEVEL SECURITY;
    -- Policies already exist in 005_notifications_monthly_checks_payment_statuses.sql
  END IF;
END $$;

-- PAYMENT_STATUSES table (already has policies in 005)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_statuses') THEN
    ALTER TABLE public.payment_statuses ENABLE ROW LEVEL SECURITY;
    -- Policies already exist in 005_notifications_monthly_checks_payment_statuses.sql
  END IF;
END $$;

-- ACHIEVEMENTS table (public/global data - read-only for all authenticated users)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'achievements') THEN
    ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Anyone can read achievements" ON achievements;
    CREATE POLICY "Anyone can read achievements" ON achievements
      FOR SELECT USING (auth.role() = 'authenticated');
    
    -- No INSERT, UPDATE, or DELETE policies - achievements are managed by admins
  END IF;
END $$;

-- CHALLENGES table (public/global data - read-only for all authenticated users)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'challenges') THEN
    ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Anyone can read challenges" ON challenges;
    CREATE POLICY "Anyone can read challenges" ON challenges
      FOR SELECT USING (auth.role() = 'authenticated');
    
    -- No INSERT, UPDATE, or DELETE policies - challenges are managed by admins
  END IF;
END $$;

-- DAILY_MOTIVATIONS table (public/global data - read-only for all authenticated users)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_motivations') THEN
    ALTER TABLE daily_motivations ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Authenticated users can read motivations" ON daily_motivations;
    CREATE POLICY "Authenticated users can read motivations" ON daily_motivations
      FOR SELECT USING (auth.role() = 'authenticated');
    
    -- No INSERT, UPDATE, or DELETE policies - motivations are managed by admins
  END IF;
END $$;

-- CREDITORS table (might be shared/public data or user-specific)
-- Check if it has user_id column
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'creditors') THEN
    ALTER TABLE creditors ENABLE ROW LEVEL SECURITY;
    
    -- Check if creditors table has user_id column
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'creditors' 
      AND column_name = 'user_id'
    ) THEN
      -- User-specific creditors
      PERFORM create_standard_rls_policies('creditors', 'user_id');
    ELSE
      -- Public/shared creditors - all authenticated users can read
      DROP POLICY IF EXISTS "Anyone can read creditors" ON creditors;
      CREATE POLICY "Anyone can read creditors" ON creditors
        FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
  END IF;
END $$;

-- FAQS table (public/global data - read-only for all authenticated users)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'faqs') THEN
    ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Anyone can read FAQs" ON faqs;
    CREATE POLICY "Anyone can read FAQs" ON faqs
      FOR SELECT USING (auth.role() = 'authenticated');
    
    -- No INSERT, UPDATE, or DELETE policies - FAQs are managed by admins
  END IF;
END $$;

-- TRANSLATIONS table (public/global data - read-only for all authenticated users)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'translations') THEN
    ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Anyone can read translations" ON translations;
    CREATE POLICY "Anyone can read translations" ON translations
      FOR SELECT USING (auth.role() = 'authenticated');
    
    -- No INSERT, UPDATE, or DELETE policies - translations are managed by admins
  END IF;
END $$;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
-- Grant necessary permissions to authenticated users for all tables
-- This allows authenticated users to perform operations allowed by RLS policies

DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name NOT IN ('schema_migrations', 'supabase_migrations')
  LOOP
    BEGIN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO authenticated', table_record.table_name);
    EXCEPTION WHEN OTHERS THEN
      -- Ignore errors for tables that don't exist or already have permissions
      RAISE NOTICE 'Could not grant permissions on table %: %', table_record.table_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- ============================================
-- VERIFICATION QUERIES (for manual checking)
-- ============================================
-- Uncomment these to verify RLS is enabled on all tables:
-- 
-- SELECT 
--   schemaname,
--   tablename,
--   rowsecurity as rls_enabled
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename;
--
-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd,
--   qual,
--   with_check
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

