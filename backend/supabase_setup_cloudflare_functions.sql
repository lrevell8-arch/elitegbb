-- ============================================================================
-- Supabase Schema Setup for Cloudflare Functions
-- This is the minimal schema needed for the Cloudflare Functions to work
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/_/sql/new
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- COACHES TABLE (Coach accounts for Cloudflare Functions)
-- ============================================================================
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_coaches_email ON coaches(email);
CREATE INDEX IF NOT EXISTS idx_coaches_school ON coaches(school);
CREATE INDEX IF NOT EXISTS idx_coaches_state ON coaches(state);

-- Row Level Security (RLS)
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

-- Allow read access to all (Cloudflare Functions handle auth)
CREATE POLICY "Allow coaches read access" ON coaches
    FOR SELECT USING (TRUE);

-- Allow insert for Cloudflare Functions
CREATE POLICY "Allow coaches insert" ON coaches
    FOR INSERT WITH CHECK (TRUE);

-- Allow update for Cloudflare Functions
CREATE POLICY "Allow coaches update" ON coaches
    FOR UPDATE USING (TRUE);

-- ============================================================================
-- PLAYERS TABLE (Minimal for coach saved_players references)
-- ============================================================================
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_key TEXT UNIQUE NOT NULL,
    player_name TEXT NOT NULL,
    email TEXT,
    school TEXT,
    state TEXT,
    grad_class TEXT,
    primary_position TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_player_key ON players(player_key);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow players read access" ON players
    FOR SELECT USING (TRUE);

-- ============================================================================
-- STAFF_USERS TABLE (Admin accounts for Cloudflare Functions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS staff_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_users_email ON staff_users(email);

ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow staff users read access" ON staff_users
    FOR SELECT USING (TRUE);

-- ============================================================================
-- SEED TEST DATA (for development/testing)
-- ============================================================================

-- Insert test coach (auto-verified for testing)
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
)
ON CONFLICT (email) DO NOTHING;

-- Insert admin user
INSERT INTO staff_users (id, email, password_hash, name, role, is_active, is_verified)
VALUES (
    uuid_generate_v4(),
    'admin@hoopwithher.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/I1W',
    'System Administrator',
    'admin',
    TRUE,
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- AUTOMATIC UPDATED_AT TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_coaches_updated_at BEFORE UPDATE ON coaches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DONE! Tables created successfully for Cloudflare Functions.
-- ============================================================================
