-- ============================================================================
-- Migration: Add missing columns to coaches table
-- Run this in Supabase SQL Editor if is_verified column is missing
-- https://app.supabase.com/project/_/sql/new
-- ============================================================================

-- Add password_hash column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coaches' AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE coaches ADD COLUMN password_hash TEXT;
        RAISE NOTICE 'Added password_hash column to coaches table';
    ELSE
        RAISE NOTICE 'password_hash column already exists';
    END IF;
END $$;

-- Add is_verified column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coaches' AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE coaches ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_verified column to coaches table';
    ELSE
        RAISE NOTICE 'is_verified column already exists';
    END IF;
END $$;

-- Add is_active column if it doesn't exist (for completeness)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coaches' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE coaches ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added is_active column to coaches table';
    ELSE
        RAISE NOTICE 'is_active column already exists';
    END IF;
END $$;

-- Add state column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coaches' AND column_name = 'state'
    ) THEN
        ALTER TABLE coaches ADD COLUMN state TEXT;
        RAISE NOTICE 'Added state column to coaches table';
    ELSE
        RAISE NOTICE 'state column already exists';
    END IF;
END $$;

-- Add saved_players column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coaches' AND column_name = 'saved_players'
    ) THEN
        ALTER TABLE coaches ADD COLUMN saved_players UUID[] DEFAULT '{}';
        RAISE NOTICE 'Added saved_players column to coaches table';
    ELSE
        RAISE NOTICE 'saved_players column already exists';
    END IF;
END $$;

-- Seed a test coach account if none exist
INSERT INTO coaches (email, password_hash, name, school, title, state, is_active, is_verified)
SELECT
    'coach@elitegbb.com',
    'PLAIN:Password123',
    'Coach Elite',
    'Elite GBB Academy',
    'Head Coach',
    'GA',
    TRUE,
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM coaches);

-- Refresh the schema cache (important for PostgREST)
NOTIFY pgrst, 'reload schema';

-- Verify columns were added
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'coaches' 
ORDER BY ordinal_position;
