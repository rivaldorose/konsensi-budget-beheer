-- Migration: Create notifications, monthly_checks, and payment_statuses tables
-- This migration fixes database schema issues where created_by column doesn't exist
-- All tables use user_id (UUID reference to auth.users) instead of created_by

-- Enable UUID extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
-- First, handle existing notifications table if it exists
DO $$
BEGIN
  -- If table exists and has 'read' column, rename it to 'is_read'
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'read'
  ) THEN
    ALTER TABLE public.notifications RENAME COLUMN "read" TO is_read;
  END IF;

  -- Add user_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add is_read column if it doesn't exist (and wasn't just renamed)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'is_read'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN is_read BOOLEAN DEFAULT false;
  END IF;

  -- Add other columns if they don't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'read_at'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success', 'fixed_cost', 'debt', 'pot', 'advice')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Make user_id NOT NULL if it was just added (after data migration if needed)
DO $$
BEGIN
  -- Only make NOT NULL if there are no NULL values
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'user_id'
      AND is_nullable = 'YES'
  ) THEN
    -- First, set user_id for any existing rows without user_id (if any)
    -- Only if created_by column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'notifications' 
      AND column_name = 'created_by'
    ) THEN
      UPDATE public.notifications
      SET user_id = (
        SELECT id FROM auth.users 
        WHERE email = notifications.created_by 
        LIMIT 1
      )
      WHERE user_id IS NULL;
    END IF;

    -- Now make it NOT NULL if all rows have user_id
    -- Only if there are no NULL values left
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications WHERE user_id IS NULL
    ) THEN
      ALTER TABLE public.notifications ALTER COLUMN user_id SET NOT NULL;
    END IF;
  END IF;
END $$;

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Enable Row Level Security for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
CREATE POLICY "Users can insert their own notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- MONTHLY_CHECKS TABLE
-- ============================================
-- Handle existing monthly_checks table if it exists
DO $$
BEGIN
  -- Add user_id column if it doesn't exist
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'monthly_checks'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'monthly_checks'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.monthly_checks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Migrate existing data if created_by exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'monthly_checks'
        AND column_name = 'created_by'
    ) THEN
      UPDATE public.monthly_checks
      SET user_id = (
        SELECT id FROM auth.users 
        WHERE email = monthly_checks.created_by 
        LIMIT 1
      )
      WHERE user_id IS NULL;
    END IF;

    -- Make NOT NULL after migration (only if no NULL values)
    IF NOT EXISTS (
      SELECT 1 FROM public.monthly_checks WHERE user_id IS NULL
    ) THEN
      ALTER TABLE public.monthly_checks ALTER COLUMN user_id SET NOT NULL;
    END IF;
  END IF;
END $$;

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.monthly_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Format: 'YYYY-MM' (e.g., '2026-01')
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month) -- One check per user per month
);

-- Create index for monthly_checks
CREATE INDEX IF NOT EXISTS idx_monthly_checks_user_id ON public.monthly_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_checks_user_month ON public.monthly_checks(user_id, month);

-- Enable Row Level Security for monthly_checks
ALTER TABLE public.monthly_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for monthly_checks
DROP POLICY IF EXISTS "Users can view their own monthly checks" ON public.monthly_checks;
CREATE POLICY "Users can view their own monthly checks" ON public.monthly_checks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own monthly checks" ON public.monthly_checks;
CREATE POLICY "Users can insert their own monthly checks" ON public.monthly_checks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own monthly checks" ON public.monthly_checks;
CREATE POLICY "Users can update their own monthly checks" ON public.monthly_checks
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own monthly checks" ON public.monthly_checks;
CREATE POLICY "Users can delete their own monthly checks" ON public.monthly_checks
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- PAYMENT_STATUSES TABLE
-- ============================================
-- Handle existing payment_statuses table if it exists
DO $$
BEGIN
  -- Add user_id column if it doesn't exist
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'payment_statuses'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payment_statuses'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.payment_statuses ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Migrate existing data if created_by exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'payment_statuses'
        AND column_name = 'created_by'
    ) THEN
      UPDATE public.payment_statuses
      SET user_id = (
        SELECT id FROM auth.users 
        WHERE email = payment_statuses.created_by 
        LIMIT 1
      )
      WHERE user_id IS NULL;
    END IF;

    -- Make NOT NULL after migration (only if no NULL values)
    IF NOT EXISTS (
      SELECT 1 FROM public.payment_statuses WHERE user_id IS NULL
    ) THEN
      ALTER TABLE public.payment_statuses ALTER COLUMN user_id SET NOT NULL;
    END IF;
  END IF;

  -- Add other missing columns if table exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'payment_statuses'
  ) THEN
    -- Add cost_id if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'payment_statuses'
        AND column_name = 'cost_id'
    ) THEN
      ALTER TABLE public.payment_statuses ADD COLUMN cost_id UUID;
    END IF;

    -- Add cost_name if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'payment_statuses'
        AND column_name = 'cost_name'
    ) THEN
      ALTER TABLE public.payment_statuses ADD COLUMN cost_name TEXT;
    END IF;

    -- Add cost_amount if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'payment_statuses'
        AND column_name = 'cost_amount'
    ) THEN
      ALTER TABLE public.payment_statuses ADD COLUMN cost_amount NUMERIC DEFAULT 0;
    END IF;

    -- Add month if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'payment_statuses'
        AND column_name = 'month'
    ) THEN
      ALTER TABLE public.payment_statuses ADD COLUMN month TEXT;
    END IF;

    -- Add is_paid if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'payment_statuses'
        AND column_name = 'is_paid'
    ) THEN
      ALTER TABLE public.payment_statuses ADD COLUMN is_paid BOOLEAN DEFAULT false;
    END IF;

    -- Add due_date if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'payment_statuses'
        AND column_name = 'due_date'
    ) THEN
      ALTER TABLE public.payment_statuses ADD COLUMN due_date DATE;
    END IF;

    -- Add postponed_to_date if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'payment_statuses'
        AND column_name = 'postponed_to_date'
    ) THEN
      ALTER TABLE public.payment_statuses ADD COLUMN postponed_to_date DATE;
    END IF;

    -- Add paid_at if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'payment_statuses'
        AND column_name = 'paid_at'
    ) THEN
      ALTER TABLE public.payment_statuses ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add notes if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'payment_statuses'
        AND column_name = 'notes'
    ) THEN
      ALTER TABLE public.payment_statuses ADD COLUMN notes TEXT;
    END IF;

    -- Add created_at if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'payment_statuses'
        AND column_name = 'created_at'
    ) THEN
      ALTER TABLE public.payment_statuses ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Add updated_at if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'payment_statuses'
        AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE public.payment_statuses ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
  END IF;
END $$;

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payment_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cost_id UUID, -- Reference to monthly_costs or debts (can be null for manual entries)
  cost_name TEXT NOT NULL,
  cost_amount NUMERIC NOT NULL DEFAULT 0,
  month TEXT NOT NULL, -- Format: 'YYYY-MM' (e.g., '2026-01')
  is_paid BOOLEAN DEFAULT false,
  due_date DATE,
  postponed_to_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for payment_statuses (only if columns exist)
DO $$
BEGIN
  -- Only create indexes if the table and columns exist
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payment_statuses'
  ) THEN
    -- User ID index
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'payment_statuses' AND column_name = 'user_id'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_payment_statuses_user_id ON public.payment_statuses(user_id);
    END IF;

    -- User ID and month index
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'payment_statuses' 
      AND column_name = 'user_id' AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'payment_statuses' AND column_name = 'month'
      )
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_payment_statuses_user_month ON public.payment_statuses(user_id, month);
    END IF;

    -- Cost ID index (only if column exists)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'payment_statuses' AND column_name = 'cost_id'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_payment_statuses_cost_id ON public.payment_statuses(cost_id) WHERE cost_id IS NOT NULL;
    END IF;

    -- Is paid index
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'payment_statuses' 
      AND column_name = 'user_id' AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'payment_statuses' AND column_name = 'is_paid'
      )
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_payment_statuses_is_paid ON public.payment_statuses(user_id, is_paid) WHERE is_paid = false;
    END IF;

    -- Postponed date index
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'payment_statuses' 
      AND column_name = 'user_id' AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'payment_statuses' AND column_name = 'postponed_to_date'
      )
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_payment_statuses_postponed ON public.payment_statuses(user_id, postponed_to_date) WHERE postponed_to_date IS NOT NULL;
    END IF;
  END IF;
END $$;

-- Enable Row Level Security for payment_statuses
ALTER TABLE public.payment_statuses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_statuses
DROP POLICY IF EXISTS "Users can view their own payment statuses" ON public.payment_statuses;
CREATE POLICY "Users can view their own payment statuses" ON public.payment_statuses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own payment statuses" ON public.payment_statuses;
CREATE POLICY "Users can insert their own payment statuses" ON public.payment_statuses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own payment statuses" ON public.payment_statuses;
CREATE POLICY "Users can update their own payment statuses" ON public.payment_statuses
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own payment statuses" ON public.payment_statuses;
CREATE POLICY "Users can delete their own payment statuses" ON public.payment_statuses
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for notifications
DROP TRIGGER IF EXISTS set_notifications_updated_at ON public.notifications;
CREATE TRIGGER set_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Triggers for monthly_checks
DROP TRIGGER IF EXISTS set_monthly_checks_updated_at ON public.monthly_checks;
CREATE TRIGGER set_monthly_checks_updated_at
  BEFORE UPDATE ON public.monthly_checks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Triggers for payment_statuses
DROP TRIGGER IF EXISTS set_payment_statuses_updated_at ON public.payment_statuses;
CREATE TRIGGER set_payment_statuses_updated_at
  BEFORE UPDATE ON public.payment_statuses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_checks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_statuses TO authenticated;

