-- Add onboarding_step column to users table
-- This migration adds the onboarding_step column to track the current step in the onboarding process

-- Add onboarding_step column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'onboarding_step'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN onboarding_step INTEGER;
    
    -- Add comment
    COMMENT ON COLUMN public.users.onboarding_step IS 'Current step in the onboarding process (1-6), null when completed';
  END IF;
END $$;

-- Ensure onboarding_completed column exists (if it doesn't already)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
    
    -- Add comment
    COMMENT ON COLUMN public.users.onboarding_completed IS 'Whether the user has completed the onboarding process';
  END IF;
END $$;

