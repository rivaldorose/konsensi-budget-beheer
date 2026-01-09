-- Fix RLS policies for income and monthly_costs tables
-- Make INSERT policies permissive so user_id can be added by the app

-- ============================================
-- INCOME TABLE
-- ============================================

-- Enable RLS
ALTER TABLE income ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own income" ON income;
DROP POLICY IF EXISTS "Users can insert own income" ON income;
DROP POLICY IF EXISTS "Users can update own income" ON income;
DROP POLICY IF EXISTS "Users can delete own income" ON income;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON income;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON income;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON income;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON income;

-- Create permissive INSERT policy (allows app to set user_id)
CREATE POLICY "Enable insert for authenticated users"
ON income
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create strict SELECT policy (users can only see their own data)
CREATE POLICY "Enable select for authenticated users"
ON income
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create strict UPDATE policy
CREATE POLICY "Enable update for authenticated users"
ON income
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create strict DELETE policy
CREATE POLICY "Enable delete for authenticated users"
ON income
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- MONTHLY_COSTS TABLE
-- ============================================

-- Enable RLS
ALTER TABLE monthly_costs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own monthly_costs" ON monthly_costs;
DROP POLICY IF EXISTS "Users can insert own monthly_costs" ON monthly_costs;
DROP POLICY IF EXISTS "Users can update own monthly_costs" ON monthly_costs;
DROP POLICY IF EXISTS "Users can delete own monthly_costs" ON monthly_costs;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON monthly_costs;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON monthly_costs;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON monthly_costs;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON monthly_costs;

-- Create permissive INSERT policy (allows app to set user_id)
CREATE POLICY "Enable insert for authenticated users"
ON monthly_costs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create strict SELECT policy (users can only see their own data)
CREATE POLICY "Enable select for authenticated users"
ON monthly_costs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create strict UPDATE policy
CREATE POLICY "Enable update for authenticated users"
ON monthly_costs
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create strict DELETE policy
CREATE POLICY "Enable delete for authenticated users"
ON monthly_costs
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
