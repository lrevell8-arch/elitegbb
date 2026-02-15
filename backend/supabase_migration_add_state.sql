-- ============================================================================
-- Migration: Add missing 'state' column to players table
-- Run this in Supabase SQL Editor if you get "column 'state' does not exist" error
-- ============================================================================

-- Add state column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'players' AND column_name = 'state'
    ) THEN
        ALTER TABLE players ADD COLUMN state TEXT;
        RAISE NOTICE 'Added state column to players table';
    ELSE
        RAISE NOTICE 'state column already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'players' 
ORDER BY ordinal_position;
