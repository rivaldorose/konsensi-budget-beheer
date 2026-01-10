-- ============================================
-- FIX USERS TABLE RLS POLICIES
-- ============================================
-- The users table has conflicting policies that prevent
-- user profile creation. This migration fixes that.
-- ============================================

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can read own users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own users" ON public.users;
DROP POLICY IF EXISTS "Users can update own users" ON public.users;
DROP POLICY IF EXISTS "Users can delete own users" ON public.users;
DROP POLICY IF EXISTS "Users can read their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

-- Recreate correct policies for users table
-- Allow users to read their own profile
CREATE POLICY "Users can read their own profile" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to insert their own profile (when first logging in)
CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure users table has RLS enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Grant permissions on users table
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
