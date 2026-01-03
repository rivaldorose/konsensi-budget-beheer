-- ============================================
-- RLS VERIFICATION AND FIX SCRIPT
-- ============================================
-- This script verifies which tables have RLS enabled and policies
-- Then creates missing policies for tables that need them
-- ============================================

-- ============================================
-- STEP 1: VERIFY CURRENT RLS STATUS
-- ============================================
-- Check which tables have RLS enabled but no policies
DO $$
DECLARE
  table_record RECORD;
  policy_count INTEGER;
  rls_enabled BOOLEAN;
BEGIN
  RAISE NOTICE '=== RLS VERIFICATION REPORT ===';
  
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name NOT IN ('schema_migrations', 'supabase_migrations')
    ORDER BY table_name
  LOOP
    -- Check if RLS is enabled
    SELECT rowsecurity INTO rls_enabled
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = table_record.table_name;
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = table_record.table_name;
    
    IF rls_enabled AND policy_count = 0 THEN
      RAISE NOTICE '⚠️  Table % has RLS enabled but NO policies!', table_record.table_name;
    ELSIF rls_enabled AND policy_count > 0 THEN
      RAISE NOTICE '✅ Table % has RLS enabled with % policies', table_record.table_name, policy_count;
    ELSIF NOT rls_enabled THEN
      RAISE NOTICE '❌ Table % does NOT have RLS enabled', table_record.table_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE '=== END VERIFICATION REPORT ===';
END $$;

-- ============================================
-- STEP 2: FIX MISSING POLICIES FOR CRITICAL TABLES
-- ============================================
-- These are the tables showing 403 errors in the console

-- INCOME table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'income') THEN
    ALTER TABLE income ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Users can read own income" ON income;
    DROP POLICY IF EXISTS "Users can insert own income" ON income;
    DROP POLICY IF EXISTS "Users can update own income" ON income;
    DROP POLICY IF EXISTS "Users can delete own income" ON income;
    
    -- Create policies
    CREATE POLICY "Users can read own income" ON income FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own income" ON income FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own income" ON income FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can delete own income" ON income FOR DELETE USING (auth.uid() = user_id);
    
    RAISE NOTICE '✅ Created policies for income table';
  END IF;
END $$;

-- DEBTS table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'debts') THEN
    ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can read own debts" ON debts;
    DROP POLICY IF EXISTS "Users can insert own debts" ON debts;
    DROP POLICY IF EXISTS "Users can update own debts" ON debts;
    DROP POLICY IF EXISTS "Users can delete own debts" ON debts;
    
    CREATE POLICY "Users can read own debts" ON debts FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own debts" ON debts FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own debts" ON debts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can delete own debts" ON debts FOR DELETE USING (auth.uid() = user_id);
    
    RAISE NOTICE '✅ Created policies for debts table';
  END IF;
END $$;

-- MONTHLY_COSTS table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'monthly_costs') THEN
    ALTER TABLE monthly_costs ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can read own monthly_costs" ON monthly_costs;
    DROP POLICY IF EXISTS "Users can insert own monthly_costs" ON monthly_costs;
    DROP POLICY IF EXISTS "Users can update own monthly_costs" ON monthly_costs;
    DROP POLICY IF EXISTS "Users can delete own monthly_costs" ON monthly_costs;
    
    CREATE POLICY "Users can read own monthly_costs" ON monthly_costs FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own monthly_costs" ON monthly_costs FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own monthly_costs" ON monthly_costs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can delete own monthly_costs" ON monthly_costs FOR DELETE USING (auth.uid() = user_id);
    
    RAISE NOTICE '✅ Created policies for monthly_costs table';
  END IF;
END $$;

-- POTS table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pots') THEN
    ALTER TABLE pots ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can read own pots" ON pots;
    DROP POLICY IF EXISTS "Users can insert own pots" ON pots;
    DROP POLICY IF EXISTS "Users can update own pots" ON pots;
    DROP POLICY IF EXISTS "Users can delete own pots" ON pots;
    
    CREATE POLICY "Users can read own pots" ON pots FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own pots" ON pots FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own pots" ON pots FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can delete own pots" ON pots FOR DELETE USING (auth.uid() = user_id);
    
    RAISE NOTICE '✅ Created policies for pots table';
  END IF;
END $$;

-- TRANSACTIONS table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
    ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can read own transactions" ON transactions;
    DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
    DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
    DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
    
    CREATE POLICY "Users can read own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);
    
    RAISE NOTICE '✅ Created policies for transactions table';
  END IF;
END $$;

-- USER_LEVELS table (from gamification)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_levels') THEN
    ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view their own levels" ON user_levels;
    DROP POLICY IF EXISTS "Users can insert their own levels" ON user_levels;
    DROP POLICY IF EXISTS "Users can update their own levels" ON user_levels;
    
    CREATE POLICY "Users can view their own levels" ON user_levels FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert their own levels" ON user_levels FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own levels" ON user_levels FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    
    RAISE NOTICE '✅ Created policies for user_levels table';
  END IF;
END $$;

-- USER_BADGES table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_badges') THEN
    ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view their own badges" ON user_badges;
    DROP POLICY IF EXISTS "Users can insert their own badges" ON user_badges;
    
    CREATE POLICY "Users can view their own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert their own badges" ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    RAISE NOTICE '✅ Created policies for user_badges table';
  END IF;
END $$;

-- DEBT_PAYMENTS table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'debt_payments') THEN
    ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can read own debt_payments" ON debt_payments;
    DROP POLICY IF EXISTS "Users can insert own debt_payments" ON debt_payments;
    DROP POLICY IF EXISTS "Users can update own debt_payments" ON debt_payments;
    DROP POLICY IF EXISTS "Users can delete own debt_payments" ON debt_payments;
    
    CREATE POLICY "Users can read own debt_payments" ON debt_payments FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own debt_payments" ON debt_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own debt_payments" ON debt_payments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can delete own debt_payments" ON debt_payments FOR DELETE USING (auth.uid() = user_id);
    
    RAISE NOTICE '✅ Created policies for debt_payments table';
  END IF;
END $$;

-- WEEK_GOALS table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'week_goals') THEN
    ALTER TABLE week_goals ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view their own week goals" ON week_goals;
    DROP POLICY IF EXISTS "Users can insert their own week goals" ON week_goals;
    DROP POLICY IF EXISTS "Users can update their own week goals" ON week_goals;
    
    CREATE POLICY "Users can view their own week goals" ON week_goals FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert their own week goals" ON week_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own week goals" ON week_goals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    
    RAISE NOTICE '✅ Created policies for week_goals table';
  END IF;
END $$;

-- DAILY_MOTIVATIONS table (public read)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_motivations') THEN
    ALTER TABLE daily_motivations ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Authenticated users can read motivations" ON daily_motivations;
    CREATE POLICY "Authenticated users can read motivations" ON daily_motivations
      FOR SELECT USING (auth.role() = 'authenticated');
    
    RAISE NOTICE '✅ Created policies for daily_motivations table';
  END IF;
END $$;

-- TRANSLATIONS table (public read)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'translations') THEN
    ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Anyone can read translations" ON translations;
    CREATE POLICY "Anyone can read translations" ON translations
      FOR SELECT USING (auth.role() = 'authenticated');
    
    RAISE NOTICE '✅ Created policies for translations table';
  END IF;
END $$;

-- ============================================
-- STEP 3: FIX USERS TABLE INSERT POLICY
-- ============================================
-- The users table needs a special INSERT policy that allows creating profile on signup
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
    DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
    
    -- SELECT policy
    CREATE POLICY "Users can view their own profile" ON public.users
      FOR SELECT USING (auth.uid() = id);
    
    -- UPDATE policy
    CREATE POLICY "Users can update their own profile" ON public.users
      FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
    
    -- INSERT policy - allow users to create their own profile
    CREATE POLICY "Users can insert their own profile" ON public.users
      FOR INSERT WITH CHECK (auth.uid() = id);
    
    RAISE NOTICE '✅ Fixed policies for users table';
  END IF;
END $$;

-- ============================================
-- STEP 4: GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- STEP 5: FINAL VERIFICATION
-- ============================================
DO $$
DECLARE
  table_record RECORD;
  policy_count INTEGER;
  rls_enabled BOOLEAN;
  missing_policies TEXT[] := ARRAY[]::TEXT[];
BEGIN
  RAISE NOTICE '=== FINAL RLS STATUS ===';
  
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name NOT IN ('schema_migrations', 'supabase_migrations')
    ORDER BY table_name
  LOOP
    SELECT rowsecurity INTO rls_enabled
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = table_record.table_name;
    
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = table_record.table_name;
    
    IF rls_enabled AND policy_count = 0 THEN
      missing_policies := array_append(missing_policies, table_record.table_name);
      RAISE NOTICE '⚠️  % still has no policies', table_record.table_name;
    END IF;
  END LOOP;
  
  IF array_length(missing_policies, 1) > 0 THEN
    RAISE NOTICE 'Tables still missing policies: %', array_to_string(missing_policies, ', ');
  ELSE
    RAISE NOTICE '✅ All tables with RLS enabled have policies!';
  END IF;
END $$;

