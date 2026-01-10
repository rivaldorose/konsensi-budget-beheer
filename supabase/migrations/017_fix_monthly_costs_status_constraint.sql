-- Fix monthly_costs status constraint to allow 'active' value

-- Drop existing constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'monthly_costs_status_check'
    AND conrelid = 'monthly_costs'::regclass
  ) THEN
    ALTER TABLE monthly_costs DROP CONSTRAINT monthly_costs_status_check;
    RAISE NOTICE 'Dropped existing monthly_costs_status_check constraint';
  END IF;
END $$;

-- Add new constraint that allows common status values
ALTER TABLE monthly_costs
ADD CONSTRAINT monthly_costs_status_check
CHECK (status IN ('active', 'inactive', 'actief', 'inactief', 'paused', 'gepauzeerd', 'cancelled', 'geannuleerd'));

-- Update any existing rows that might have invalid status
UPDATE monthly_costs
SET status = 'active'
WHERE status IS NULL OR status NOT IN ('active', 'inactive', 'actief', 'inactief', 'paused', 'gepauzeerd', 'cancelled', 'geannuleerd');
