-- ============================================
-- GRANT PERMISSIONS AND FIX RLS POLICIES
-- ============================================
-- This migration grants necessary permissions to authenticated users
-- and ensures all tables with user_id have proper RLS policies
-- ============================================

-- ============================================
-- GRANT PERMISSIONS TO AUTHENTICATED USERS
-- ============================================
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant permissions on all tables
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
      RAISE NOTICE 'Granted permissions on %', table_record.table_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not grant permissions on %: %', table_record.table_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- ENABLE RLS AND CREATE POLICIES FOR ALL TABLES WITH USER_ID
-- ============================================
DO $$
DECLARE
  table_record RECORD;
  has_user_id BOOLEAN;
BEGIN
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name NOT IN ('schema_migrations', 'supabase_migrations', 'users', 'achievements', 'challenges', 'daily_motivations', 'faqs', 'translations', 'creditors')
  LOOP
    -- Check if table has user_id column
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = table_record.table_name 
      AND column_name = 'user_id'
    ) INTO has_user_id;

    IF has_user_id THEN
      -- Enable RLS
      BEGIN
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_record.table_name);
        
        -- Drop existing policies
        EXECUTE format('DROP POLICY IF EXISTS "Users can read own %I" ON %I', table_record.table_name, table_record.table_name);
        EXECUTE format('DROP POLICY IF EXISTS "Users can insert own %I" ON %I', table_record.table_name, table_record.table_name);
        EXECUTE format('DROP POLICY IF EXISTS "Users can update own %I" ON %I', table_record.table_name, table_record.table_name);
        EXECUTE format('DROP POLICY IF EXISTS "Users can delete own %I" ON %I', table_record.table_name, table_record.table_name);
        
        -- Create policies
        EXECUTE format('CREATE POLICY "Users can read own %I" ON %I FOR SELECT USING (auth.uid() = user_id)', table_record.table_name, table_record.table_name);
        EXECUTE format('CREATE POLICY "Users can insert own %I" ON %I FOR INSERT WITH CHECK (auth.uid() = user_id)', table_record.table_name, table_record.table_name);
        EXECUTE format('CREATE POLICY "Users can update own %I" ON %I FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', table_record.table_name, table_record.table_name);
        EXECUTE format('CREATE POLICY "Users can delete own %I" ON %I FOR DELETE USING (auth.uid() = user_id)', table_record.table_name, table_record.table_name);
        
        RAISE NOTICE 'Created RLS policies for %', table_record.table_name;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create policies for %: %', table_record.table_name, SQLERRM;
      END;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- FIX PUBLIC TABLES (read-only for authenticated)
-- ============================================

-- Daily_motivations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_motivations') THEN
    ALTER TABLE daily_motivations ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Authenticated users can read motivations" ON daily_motivations;
    CREATE POLICY "Authenticated users can read motivations" ON daily_motivations
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Translations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'translations') THEN
    ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Anyone can read translations" ON translations;
    CREATE POLICY "Anyone can read translations" ON translations
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Achievements
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'achievements') THEN
    ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Anyone can read achievements" ON achievements;
    CREATE POLICY "Anyone can read achievements" ON achievements
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Challenges
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'challenges') THEN
    ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Anyone can read challenges" ON challenges;
    CREATE POLICY "Anyone can read challenges" ON challenges
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- FAQs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'faqs') THEN
    ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Anyone can read FAQs" ON faqs;
    CREATE POLICY "Anyone can read FAQs" ON faqs
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

