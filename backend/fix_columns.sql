-- Fix column issues for test data loader
-- Run this in Supabase SQL Editor

-- ============================================================================
-- Fix 1: intake_submissions - Add package_selected default or make nullable
-- ============================================================================

-- Option A: Make package_selected nullable (allows loader to work as-is)
ALTER TABLE intake_submissions ALTER COLUMN package_selected DROP NOT NULL;

-- Option B: Add default value (uncomment if you prefer this)
-- ALTER TABLE intake_submissions ALTER COLUMN package_selected SET DEFAULT 'development';

-- ============================================================================
-- Fix 2: deliverables - The loader uses 'type' but column might be 'deliverable_type'
-- Check what columns exist and fix accordingly
-- ============================================================================

-- First, let's see what columns actually exist in deliverables
-- (You can verify this in Supabase Table Editor)

-- If the column is named 'deliverable_type' instead of 'type', rename it:
-- DO $$
-- BEGIN
--     IF EXISTS (SELECT 1 FROM information_schema.columns 
--                WHERE table_name = 'deliverables' AND column_name = 'deliverable_type') THEN
--         ALTER TABLE deliverables RENAME COLUMN deliverable_type TO type;
--     END IF;
-- END $$;

-- Alternative: Make deliverable_type nullable if it exists and is causing issues
ALTER TABLE deliverables ALTER COLUMN deliverable_type DROP NOT NULL;

-- Also make sure 'type' column exists and is nullable
-- (The migration added this, but let's ensure it's nullable)
ALTER TABLE deliverables ALTER COLUMN type DROP NOT NULL;

-- ============================================================================
-- Fix 3: If there's a conflict between 'type' and 'deliverable_type', 
-- we can drop one and keep the other
-- ============================================================================

-- Check if both columns exist and drop the redundant one
-- DO $$
-- BEGIN
--     IF EXISTS (SELECT 1 FROM information_schema.columns 
--                WHERE table_name = 'deliverables' AND column_name = 'deliverable_type')
--        AND EXISTS (SELECT 1 FROM information_schema.columns 
--                    WHERE table_name = 'deliverables' AND column_name = 'type') THEN
--         -- Both exist, drop deliverable_type and keep type
--         ALTER TABLE deliverables DROP COLUMN deliverable_type;
--     END IF;
-- END $$;

-- ============================================================================
-- Refresh schema cache
-- ============================================================================
NOTIFY pgrst, 'reload schema';

SELECT 'Column fixes applied successfully!' as status;
