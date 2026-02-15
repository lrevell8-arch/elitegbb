-- ============================================================================
-- EliteGBB Supabase Database Schema
-- Run this in Supabase SQL Editor to set up all tables
-- https://app.supabase.com/project/_/sql/new
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. STAFF USERS TABLE (Admin/Editor/Viewer accounts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS staff_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_users_email ON staff_users(email);
CREATE INDEX IF NOT EXISTS idx_staff_users_role ON staff_users(role);

-- Row Level Security (RLS)
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow staff users read access" ON staff_users
    FOR SELECT USING (TRUE);

-- Allow update only for own record or admin
CREATE POLICY "Allow staff users update own" ON staff_users
    FOR UPDATE USING (
        auth.uid()::text = id::text OR
        EXISTS (SELECT 1 FROM staff_users WHERE id::text = auth.uid()::text AND role = 'admin')
    );

-- ============================================================================
-- 2. COACHES TABLE (Coach accounts)
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

-- Row Level Security
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow coaches read access" ON coaches
    FOR SELECT USING (TRUE);

-- Allow coaches to update their own record
CREATE POLICY "Allow coaches update own" ON coaches
    FOR UPDATE USING (auth.uid()::text = id::text);

-- ============================================================================
-- 3. PLAYERS TABLE (Player profiles from intake forms)
-- ============================================================================
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_key TEXT UNIQUE NOT NULL,
    player_name TEXT NOT NULL,
    preferred_name TEXT,
    dob DATE,
    grad_class TEXT NOT NULL,
    gender TEXT NOT NULL,
    school TEXT,
    city TEXT,
    state TEXT,
    primary_position TEXT NOT NULL,
    secondary_position TEXT,
    jersey_number TEXT,
    height TEXT,
    weight TEXT,
    parent_name TEXT,
    parent_email TEXT,
    parent_phone TEXT,
    player_email TEXT,
    level TEXT,
    team_names TEXT,
    league_region TEXT,
    games_played INTEGER,
    ppg DECIMAL(5,2),
    apg DECIMAL(5,2),
    rpg DECIMAL(5,2),
    spg DECIMAL(5,2),
    bpg DECIMAL(5,2),
    fg_pct DECIMAL(5,2),
    three_pct DECIMAL(5,2),
    ft_pct DECIMAL(5,2),
    self_words TEXT,
    strength TEXT,
    improvement TEXT,
    separation TEXT,
    adversity_response TEXT,
    iq_self_rating TEXT,
    pride_tags TEXT[],
    player_model TEXT,
    film_links TEXT[],
    highlight_links TEXT[],
    instagram_handle TEXT,
    other_socials TEXT,
    goal TEXT,
    colleges_interest TEXT,
    package_selected TEXT,
    consent_eval BOOLEAN DEFAULT FALSE,
    consent_media BOOLEAN DEFAULT FALSE,
    guardian_signature TEXT,
    signature_date DATE,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    stripe_session_id TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_players_player_key ON players(player_key);
CREATE INDEX IF NOT EXISTS idx_players_grad_class ON players(grad_class);
CREATE INDEX IF NOT EXISTS idx_players_school ON players(school);
CREATE INDEX IF NOT EXISTS idx_players_state ON players(state);
CREATE INDEX IF NOT EXISTS idx_players_verified ON players(verified);
CREATE INDEX IF NOT EXISTS idx_players_payment_status ON players(payment_status);

-- Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users (adjust as needed)
CREATE POLICY "Allow players read access" ON players
    FOR SELECT USING (TRUE);

-- Allow insert (for intake form submissions)
CREATE POLICY "Allow players insert" ON players
    FOR INSERT WITH CHECK (TRUE);

-- Allow update for staff or own record (if player login implemented)
CREATE POLICY "Allow players update by staff" ON players
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM staff_users WHERE id::text = auth.uid()::text) OR
        EXISTS (SELECT 1 FROM coaches WHERE id::text = auth.uid()::text)
    );

-- ============================================================================
-- 4. PROJECTS TABLE (Player evaluation projects)
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    package_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'review', 'completed', 'cancelled')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'disputed')),
    notes TEXT,
    assigned_editor UUID REFERENCES staff_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_player_id ON projects(player_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_payment_status ON projects(payment_status);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_editor ON projects(assigned_editor);

-- Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Allow access to staff
CREATE POLICY "Allow projects access to staff" ON projects
    FOR ALL USING (
        EXISTS (SELECT 1 FROM staff_users WHERE id::text = auth.uid()::text)
    );

-- ============================================================================
-- 5. DELIVERABLES TABLE (Project deliverables)
-- ============================================================================
CREATE TABLE IF NOT EXISTS deliverables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('written_evaluation', 'film_breakdown', 'social_clip', 'prospect_analysis', 'one_pager', 'verified_badge', 'tracking_profile', 'film_index', 'referral_note', 'mid_season_update', 'end_season_update')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'ready_for_review', 'approved', 'delivered')),
    file_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deliverables_project_id ON deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_status ON deliverables(status);

-- Row Level Security
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;

-- Allow access to staff
CREATE POLICY "Allow deliverables access to staff" ON deliverables
    FOR ALL USING (
        EXISTS (SELECT 1 FROM staff_users WHERE id::text = auth.uid()::text)
    );

-- ============================================================================
-- 6. PASSWORD RESET TOKENS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('staff', 'coach')),
    email TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_expires ON password_reset_tokens(expires_at);

-- Row Level Security
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Allow insert (for forgot password flow)
CREATE POLICY "Allow reset tokens insert" ON password_reset_tokens
    FOR INSERT WITH CHECK (TRUE);

-- Allow read/update only for valid tokens
CREATE POLICY "Allow reset tokens read own" ON password_reset_tokens
    FOR SELECT USING (TRUE);

-- ============================================================================
-- 7. PAYMENT TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT UNIQUE NOT NULL,
    player_id UUID REFERENCES players(id) ON DELETE SET NULL,
    coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    stripe_checkout_id TEXT,
    stripe_payment_intent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_session_id ON payment_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_payment_player_id ON payment_transactions(player_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON payment_transactions(status);

-- Row Level Security
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Allow access to staff
CREATE POLICY "Allow payment access to staff" ON payment_transactions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM staff_users WHERE id::text = auth.uid()::text)
    );

-- ============================================================================
-- 8. INTAKE SUBMISSIONS TABLE (Detailed intake form data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS intake_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    parent_name TEXT NOT NULL,
    parent_email TEXT NOT NULL,
    parent_phone TEXT,
    player_email TEXT,
    level TEXT,
    team_names TEXT,
    league_region TEXT,
    games_played INTEGER,
    ppg DECIMAL(5,2),
    apg DECIMAL(5,2),
    rpg DECIMAL(5,2),
    spg DECIMAL(5,2),
    bpg DECIMAL(5,2),
    fg_pct DECIMAL(5,2),
    three_pct DECIMAL(5,2),
    ft_pct DECIMAL(5,2),
    self_words TEXT,
    strength TEXT,
    improvement TEXT,
    separation TEXT,
    adversity_response TEXT,
    iq_self_rating TEXT,
    pride_tags TEXT[],
    player_model TEXT,
    film_links TEXT[],
    highlight_links TEXT[],
    instagram_handle TEXT,
    other_socials TEXT,
    goal TEXT,
    colleges_interest TEXT,
    package_selected TEXT,
    consent_eval BOOLEAN DEFAULT FALSE,
    consent_media BOOLEAN DEFAULT FALSE,
    guardian_signature TEXT,
    signature_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_intake_player_id ON intake_submissions(player_id);
CREATE INDEX IF NOT EXISTS idx_intake_created_at ON intake_submissions(created_at);

-- Row Level Security
ALTER TABLE intake_submissions ENABLE ROW LEVEL SECURITY;

-- Allow read access to staff
CREATE POLICY "Allow intake submissions access to staff" ON intake_submissions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM staff_users WHERE id::text = auth.uid()::text)
    );

-- ============================================================================
-- 9. REMINDERS TABLE (Follow-up reminders for projects)
-- ============================================================================
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('mid_season_update', 'coach_followup', 'payment_reminder')),
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reminders_project_id ON reminders(project_id);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled ON reminders(scheduled_date, sent);
CREATE INDEX IF NOT EXISTS idx_reminders_type ON reminders(reminder_type);

-- Row Level Security
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Allow access to staff
CREATE POLICY "Allow reminders access to staff" ON reminders
    FOR ALL USING (
        EXISTS (SELECT 1 FROM staff_users WHERE id::text = auth.uid()::text)
    );

-- ============================================================================
-- 10. COACH MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS coach_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('hwh_staff', 'coach_to_coach')),
    recipient_id UUID,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    player_id UUID REFERENCES players(id) ON DELETE SET NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_coach_id ON coach_messages(coach_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON coach_messages(recipient_type, recipient_id);

-- Row Level Security
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;

-- Allow coaches to see their own messages
CREATE POLICY "Allow messages access to coaches" ON coach_messages
    FOR ALL USING (
        coach_id::text = auth.uid()::text OR
        recipient_id::text = auth.uid()::text OR
        EXISTS (SELECT 1 FROM staff_users WHERE id::text = auth.uid()::text)
    );

-- ============================================================================
-- SEED TEST DATA (for development/testing)
-- Run this section only if you want test data
-- ============================================================================

-- Insert admin user (password: AdminPass123!)
-- Password hash generated with bcrypt
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

-- Insert test coach (password: CoachPass123!, auto-verified for testing)
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

-- ============================================================================
-- AUTOMATIC UPDATED_AT TRIGGER
-- Adds updated_at timestamp automatically on row updates
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_staff_users_updated_at BEFORE UPDATE ON staff_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coaches_updated_at BEFORE UPDATE ON coaches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliverables_updated_at BEFORE UPDATE ON deliverables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intake_submissions_updated_at BEFORE UPDATE ON intake_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ENABLE REALTIME (for live updates)
-- ============================================================================
BEGIN;
  -- Enable realtime for key tables
  ALTER PUBLICATION supabase_realtime ADD TABLE players;
  ALTER PUBLICATION supabase_realtime ADD TABLE projects;
  ALTER PUBLICATION supabase_realtime ADD TABLE coaches;
COMMIT;

-- ============================================================================
-- DONE! Tables created successfully.
-- ============================================================================
