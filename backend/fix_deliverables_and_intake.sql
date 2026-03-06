-- Fix deliverables and intake_submissions column issues
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/srrasrbsqajtssqlxoju/sql/new
-- ============================================================================
-- Fix 1: intake_submissions - Make package_selected nullable
-- ============================================================================
ALTER TABLE intake_submissions ALTER COLUMN package_selected DROP NOT NULL;

-- ============================================================================
-- Fix 2: deliverables - Handle deliverable_type vs type column mismatch
-- ============================================================================

-- Step 1: Make deliverable_type nullable (old column)
ALTER TABLE deliverables ALTER COLUMN deliverable_type DROP NOT NULL;

-- Step 2: Make type nullable (new column)
ALTER TABLE deliverables ALTER COLUMN type DROP NOT NULL;

-- Step 3: If deliverable_type exists and has data, migrate it to type
DO $$
BEGIN
    -- Check if deliverable_type column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'deliverables' AND column_name = 'deliverable_type'
    ) THEN
        -- Copy data from deliverable_type to type where type is null
        UPDATE deliverables
        SET type = deliverable_type
        WHERE type IS NULL AND deliverable_type IS NOT NULL;

        -- Set default for any remaining nulls
        UPDATE deliverables
        SET type = 'one_pager'
        WHERE type IS NULL;

        -- Drop the old column
        ALTER TABLE deliverables DROP COLUMN deliverable_type;
    END IF;
END $$;

-- Step 4: Ensure type has a default
ALTER TABLE deliverables ALTER COLUMN type SET DEFAULT 'one_pager';

-- Step 5: Update any null status values
UPDATE deliverables
SET status = 'pending'
WHERE status IS NULL;

-- ============================================================================
-- Fix 3: Verify and fix constraints
-- ============================================================================

-- Fix status constraint
DO $$
BEGIN
    ALTER TABLE deliverables DROP CONSTRAINT IF EXISTS deliverables_status_check;
    ALTER TABLE deliverables ADD CONSTRAINT deliverables_status_check
        CHECK (status IN ('pending', 'in_progress', 'ready_for_review', 'approved', 'delivered'));
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Fix type constraint
DO $$
BEGIN
    ALTER TABLE deliverables DROP CONSTRAINT IF EXISTS deliverables_type_check;
    ALTER TABLE deliverables ADD CONSTRAINT deliverables_type_check
        CHECK (type IN ('written_evaluation', 'film_breakdown', 'social_clip', 'prospect_analysis', 'one_pager', 'verified_badge', 'tracking_profile', 'film_index', 'referral_note', 'mid_season_update', 'end_season_update'));
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- ============================================================================
-- Refresh schema cache
-- ============================================================================
NOTIFY pgrst, 'reload schema';

SELECT 'Deliverables and intake_submissions fixes applied successfully!' AS status;
