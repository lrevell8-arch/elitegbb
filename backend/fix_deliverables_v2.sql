-- Fix deliverables column issues - Version 2
-- Handles data transformation from old format to new format

DO $$
BEGIN
    -- Step 1: Drop existing constraints that might interfere
    BEGIN
        ALTER TABLE deliverables DROP CONSTRAINT IF EXISTS deliverables_type_check;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'deliverables_type_check does not exist';
    END;

    -- Step 2: Make both columns nullable temporarily
    BEGIN
        ALTER TABLE deliverables ALTER COLUMN deliverable_type DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'deliverable_type column may not exist';
    END;

    BEGIN
        ALTER TABLE deliverables ALTER COLUMN type DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'type column alteration issue';
    END;

    -- Step 3: Add type column if it doesn't exist
    BEGIN
        ALTER TABLE deliverables ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'type column may already exist';
    END;

    -- Step 4: Transform and migrate data from deliverable_type to type
    -- Handle various formats: 'One-Pager' -> 'one_pager', 'Tracking Profile' -> 'tracking_profile', etc.
    UPDATE deliverables
    SET type = CASE
        WHEN deliverable_type ILIKE 'onepager' OR deliverable_type ILIKE 'one-pager' OR deliverable_type ILIKE 'one pager' THEN 'one_pager'
        WHEN deliverable_type ILIKE 'trackingprofile' OR deliverable_type ILIKE 'tracking-profile' OR deliverable_type ILIKE 'tracking profile' THEN 'tracking_profile'
        WHEN deliverable_type ILIKE 'verifiedbadge' OR deliverable_type ILIKE 'verified-badge' OR deliverable_type ILIKE 'verified badge' THEN 'verified_badge'
        WHEN deliverable_type ILIKE 'filmbreakdown' OR deliverable_type ILIKE 'film-breakdown' OR deliverable_type ILIKE 'film breakdown' THEN 'film_breakdown'
        WHEN deliverable_type ILIKE 'socialclip' OR deliverable_type ILIKE 'social-clip' OR deliverable_type ILIKE 'social clip' THEN 'social_clip'
        WHEN deliverable_type ILIKE 'writtenevaluation' OR deliverable_type ILIKE 'written-evaluation' OR deliverable_type ILIKE 'written evaluation' THEN 'written_evaluation'
        WHEN deliverable_type ILIKE 'prospectanalysis' OR deliverable_type ILIKE 'prospect-analysis' OR deliverable_type ILIKE 'prospect analysis' THEN 'prospect_analysis'
        WHEN deliverable_type ILIKE 'filmindex' OR deliverable_type ILIKE 'film-index' OR deliverable_type ILIKE 'film index' THEN 'film_index'
        WHEN deliverable_type ILIKE 'referralnote' OR deliverable_type ILIKE 'referral-note' OR deliverable_type ILIKE 'referral note' THEN 'referral_note'
        WHEN deliverable_type ILIKE 'midseason' OR deliverable_type ILIKE 'mid-season' OR deliverable_type ILIKE 'mid season' OR deliverable_type ILIKE 'mid_season' THEN 'mid_season_update'
        WHEN deliverable_type ILIKE 'endseason' OR deliverable_type ILIKE 'end-season' OR deliverable_type ILIKE 'end season' OR deliverable_type ILIKE 'end_season' THEN 'end_season_update'
        ELSE LOWER(REPLACE(REPLACE(deliverable_type, ' ', '_'), '-', '_'))
    END
    WHERE type IS NULL AND deliverable_type IS NOT NULL;

    -- Step 5: Set any remaining NULL types to a default value
    UPDATE deliverables SET type = 'one_pager' WHERE type IS NULL;

    -- Step 6: Now safe to drop the old deliverable_type column
    BEGIN
        ALTER TABLE deliverables DROP COLUMN IF EXISTS deliverable_type;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'deliverable_type column may not exist';
    END;

    -- Step 7: Add new check constraint with valid type values
    ALTER TABLE deliverables
    ADD CONSTRAINT deliverables_type_check
    CHECK (type IN (
        'written_evaluation',
        'film_breakdown',
        'social_clip',
        'prospect_analysis',
        'one_pager',
        'verified_badge',
        'tracking_profile',
        'film_index',
        'referral_note',
        'mid_season_update',
        'end_season_update'
    ));

    -- Step 8: Fix status constraint as well
    BEGIN
        ALTER TABLE deliverables DROP CONSTRAINT IF EXISTS deliverables_status_check;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'deliverables_status_check does not exist';
    END;

    -- Normalize status values
    UPDATE deliverables
    SET status = CASE
        WHEN status ILIKE 'pending' THEN 'pending'
        WHEN status ILIKE 'in progress' OR status ILIKE 'in_progress' THEN 'in_progress'
        WHEN status ILIKE 'ready for review' OR status ILIKE 'ready_for_review' THEN 'ready_for_review'
        WHEN status ILIKE 'approved' THEN 'approved'
        WHEN status ILIKE 'delivered' THEN 'delivered'
        ELSE 'pending'
    END
    WHERE status IS NOT NULL;

    -- Add status check constraint
    ALTER TABLE deliverables
    ADD CONSTRAINT deliverables_status_check
    CHECK (status IN ('pending', 'in_progress', 'ready_for_review', 'approved', 'delivered'));

    -- Step 9: Make type NOT NULL now that data is migrated
    ALTER TABLE deliverables ALTER COLUMN type SET NOT NULL;

    RAISE NOTICE 'Deliverables table fixed successfully!';
END $$;

-- Also fix intake_submissions to make package_selected nullable
DO $$
BEGIN
    ALTER TABLE intake_submissions ALTER COLUMN package_selected DROP NOT NULL;
    RAISE NOTICE 'intake_submissions.package_selected is now nullable';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter intake_submissions.package_selected: %', SQLERRM;
END $$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

SELECT 'Fix completed successfully!' as status;
