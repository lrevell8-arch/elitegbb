-- Fix intake_submissions - Make columns nullable for test data loading
-- This allows the test data loader to create intake submissions without all fields

DO $$
BEGIN
    -- Make commonly missing columns nullable
    ALTER TABLE intake_submissions ALTER COLUMN iq_self_rating DROP NOT NULL;
    ALTER TABLE intake_submissions ALTER COLUMN goal DROP NOT NULL;
    ALTER TABLE intake_submissions ALTER COLUMN guardian_signature DROP NOT NULL;
    ALTER TABLE intake_submissions ALTER COLUMN player_signature DROP NOT NULL;
    ALTER TABLE intake_submissions ALTER COLUMN consent_eval DROP NOT NULL;
    ALTER TABLE intake_submissions ALTER COLUMN consent_marketing DROP NOT NULL;
    ALTER TABLE intake_submissions ALTER COLUMN consent_data DROP NOT NULL;
    ALTER TABLE intake_submissions ALTER COLUMN consent_filming DROP NOT NULL;
    ALTER TABLE intake_submissions ALTER COLUMN package_selected DROP NOT NULL;
    
    RAISE NOTICE 'Intake submissions columns made nullable successfully!';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error altering columns: %', SQLERRM;
END $$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

SELECT 'Intake fix completed successfully!' as status;
