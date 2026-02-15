-- ============================================================================
-- Setup Script for "hoopwithherbasketball-lab's Project" Supabase
-- This script safely adds any missing columns without breaking existing data
-- ============================================================================

-- ============================================================================
-- 1. COACHES TABLE - Ensure all columns exist
-- ============================================================================

-- Check if coaches table exists, create if not
CREATE TABLE IF NOT EXISTS coaches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    school TEXT NOT NULL,
    title TEXT DEFAULT 'Coach',
    state TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    saved_players UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if table already exists (safe ALTER operations)
DO $$
BEGIN
    -- Add is_verified if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'coaches' AND column_name = 'is_verified') THEN
        ALTER TABLE coaches ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_verified column';
    END IF;

    -- Add is_active if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'coaches' AND column_name = 'is_active') THEN
        ALTER TABLE coaches ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added is_active column';
    END IF;

    -- Add state if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'coaches' AND column_name = 'state') THEN
        ALTER TABLE coaches ADD COLUMN state TEXT;
        RAISE NOTICE 'Added state column';
    END IF;

    -- Add saved_players if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'coaches' AND column_name = 'saved_players') THEN
        ALTER TABLE coaches ADD COLUMN saved_players UUID[] DEFAULT '{}';
        RAISE NOTICE 'Added saved_players column';
    END IF;

    -- Add title if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'coaches' AND column_name = 'title') THEN
        ALTER TABLE coaches ADD COLUMN title TEXT DEFAULT 'Coach';
        RAISE NOTICE 'Added title column';
    END IF;

    -- Add updated_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'coaches' AND column_name = 'updated_at') THEN
        ALTER TABLE coaches ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_coaches_email ON coaches(email);
CREATE INDEX IF NOT EXISTS idx_coaches_school ON coaches(school);
CREATE INDEX IF NOT EXISTS idx_coaches_state ON coaches(state);

-- Enable RLS
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow coaches read access" ON coaches;
DROP POLICY IF EXISTS "Allow coaches insert" ON coaches;
DROP POLICY IF EXISTS "Allow coaches update" ON coaches;

-- Create policies
CREATE POLICY "Allow coaches read access" ON coaches FOR SELECT USING (TRUE);
CREATE POLICY "Allow coaches insert" ON coaches FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow coaches update" ON coaches FOR UPDATE USING (TRUE);

-- ============================================================================
-- 2. UPDATE TRIGGER for updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists to avoid conflicts
DROP TRIGGER IF EXISTS update_coaches_updated_at ON coaches;

CREATE TRIGGER update_coaches_updated_at BEFORE UPDATE ON coaches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. SEED TEST DATA (only if table is empty)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM coaches LIMIT 1) THEN
        INSERT INTO coaches (id, email, password_hash, name, school, title, state, is_active, is_verified)
        VALUES (
            uuid_generate_v4(),
            'coach@university.edu',
            '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/I1W',
            'Coach Johnson',
            'University State',
            'Head Coach',
            'CA',
            TRUE,
            TRUE
        );
        RAISE NOTICE 'Added test coach: coach@university.edu / CoachPass123!';
    END IF;
END $$;

-- ============================================================================
-- 4. VERIFY SETUP
-- ============================================================================
SELECT 
    'Setup Complete' as status,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'coaches' 
ORDER BY ordinal_position;
