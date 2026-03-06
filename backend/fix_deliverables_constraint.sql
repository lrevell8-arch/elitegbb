-- Fix deliverables constraint violation
-- First update invalid status values, then add constraint

-- Step 1: See what status values currently exist
-- SELECT DISTINCT status FROM deliverables;

-- Step 2: Update any invalid status values to 'pending'
UPDATE deliverables 
SET status = 'pending' 
WHERE status IS NULL 
   OR status NOT IN ('pending', 'in_progress', 'ready_for_review', 'approved', 'delivered');

-- Step 3: Now add the constraint
ALTER TABLE deliverables DROP CONSTRAINT IF EXISTS deliverables_status_check;

ALTER TABLE deliverables ADD CONSTRAINT deliverables_status_check
  CHECK (status IN ('pending', 'in_progress', 'ready_for_review', 'approved', 'delivered'));

SELECT 'Deliverables constraint fixed!' as status;
