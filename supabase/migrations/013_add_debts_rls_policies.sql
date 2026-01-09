-- Enable RLS and create policies for debts table

-- Enable RLS on debts table if not already enabled
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own debts" ON debts;
DROP POLICY IF EXISTS "Users can insert their own debts" ON debts;
DROP POLICY IF EXISTS "Users can update their own debts" ON debts;
DROP POLICY IF EXISTS "Users can delete their own debts" ON debts;

-- SELECT policy: Users can view their own debts
CREATE POLICY "Users can view their own debts"
ON debts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT policy: Users can insert their own debts
CREATE POLICY "Users can insert their own debts"
ON debts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE policy: Users can update their own debts
CREATE POLICY "Users can update their own debts"
ON debts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE policy: Users can delete their own debts
CREATE POLICY "Users can delete their own debts"
ON debts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
