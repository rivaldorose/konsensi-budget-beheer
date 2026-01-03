-- ============================================
-- GRANT PERMISSIONS AND FIX RLS POLICIES
-- ============================================
-- This migration ensures all tables have proper permissions
-- and fixes policies for tables that should be publicly readable
-- ============================================

-- Grant schema usage to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on ALL tables to authenticated users
DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT IN ('schema_migrations', 'supabase_migrations')
  LOOP
    BEGIN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', table_record.tablename);
      RAISE NOTICE 'Granted permissions on table %', table_record.tablename;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not grant permissions on table %: %', table_record.tablename, SQLERRM;
    END;
  END LOOP;
END $$;

-- Grant permissions on ALL sequences to authenticated users
DO $$
DECLARE
  seq_record RECORD;
BEGIN
  FOR seq_record IN
    SELECT sequencename
    FROM pg_sequences
    WHERE schemaname = 'public'
  LOOP
    BEGIN
      EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE public.%I TO authenticated', seq_record.sequencename);
      RAISE NOTICE 'Granted permissions on sequence %', seq_record.sequencename;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not grant permissions on sequence %: %', seq_record.sequencename, SQLERRM;
    END;
  END LOOP;
END $$;

-- ============================================
-- Fix policies for public/reference tables
-- ============================================
-- Some tables should be readable by all authenticated users
-- (e.g., daily_motivations, achievements, challenges, faqs)

-- Daily motivations - should be readable by all
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_motivations') THEN
    -- Drop restrictive policy if it exists
    DROP POLICY IF EXISTS "Users can read own daily_motivations" ON daily_motivations;

    -- Create public read policy
    DROP POLICY IF EXISTS "Authenticated users can read all motivations" ON daily_motivations;
    CREATE POLICY "Authenticated users can read all motivations" ON daily_motivations
      FOR SELECT
      USING (auth.role() = 'authenticated');

    RAISE NOTICE 'Fixed policies for daily_motivations';
  END IF;
END $$;

-- Achievements - should be readable by all
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'achievements') THEN
    DROP POLICY IF EXISTS "Users can read own achievements" ON achievements;
    DROP POLICY IF EXISTS "Authenticated users can read all achievements" ON achievements;
    CREATE POLICY "Authenticated users can read all achievements" ON achievements
      FOR SELECT
      USING (auth.role() = 'authenticated');

    RAISE NOTICE 'Fixed policies for achievements';
  END IF;
END $$;

-- Challenges - should be readable by all
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'challenges') THEN
    DROP POLICY IF EXISTS "Users can read own challenges" ON challenges;
    DROP POLICY IF EXISTS "Authenticated users can read all challenges" ON challenges;
    CREATE POLICY "Authenticated users can read all challenges" ON challenges
      FOR SELECT
      USING (auth.role() = 'authenticated');

    RAISE NOTICE 'Fixed policies for challenges';
  END IF;
END $$;

-- FAQs - should be readable by all
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'faqs') THEN
    DROP POLICY IF EXISTS "Users can read own faqs" ON faqs;
    DROP POLICY IF EXISTS "Authenticated users can read all faqs" ON faqs;
    CREATE POLICY "Authenticated users can read all faqs" ON faqs
      FOR SELECT
      USING (auth.role() = 'authenticated');

    RAISE NOTICE 'Fixed policies for faqs';
  END IF;
END $$;

-- Translations - should be readable by all
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'translations') THEN
    DROP POLICY IF EXISTS "Users can read own translations" ON translations;
    DROP POLICY IF EXISTS "Authenticated users can read all translations" ON translations;
    CREATE POLICY "Authenticated users can read all translations" ON translations
      FOR SELECT
      USING (auth.role() = 'authenticated');

    RAISE NOTICE 'Fixed policies for translations';
  END IF;
END $$;

-- ============================================
-- Verify all tables have RLS enabled
-- ============================================
DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT IN ('schema_migrations', 'supabase_migrations')
  LOOP
    -- Ensure RLS is enabled
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.tablename);
  END LOOP;
  RAISE NOTICE 'RLS enabled on all tables';
END $$;
