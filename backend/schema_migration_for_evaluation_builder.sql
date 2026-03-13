-- ============================================================================
-- Schema Migration for Evaluation Builder
-- This adds missing columns to support the evaluation builder functionality
-- Run this in Supabase SQL Editor before using the test data loader
-- ============================================================================

-- ============================================================================
-- 1. Update PLAYERS table - Add missing columns for stats and evaluation data
-- ============================================================================
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS level TEXT,
  ADD COLUMN IF NOT EXISTS team_names TEXT,
  ADD COLUMN IF NOT EXISTS league_region TEXT,
  ADD COLUMN IF NOT EXISTS games_played INTEGER,
  ADD COLUMN IF NOT EXISTS ppg DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS apg DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS rpg DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS spg DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS bpg DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS fg_pct DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS three_pct DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS ft_pct DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS self_words TEXT,
  ADD COLUMN IF NOT EXISTS strength TEXT,
  ADD COLUMN IF NOT EXISTS improvement TEXT,
  ADD COLUMN IF NOT EXISTS separation TEXT,
  ADD COLUMN IF NOT EXISTS adversity_response TEXT,
  ADD COLUMN IF NOT EXISTS iq_self_rating TEXT,
  ADD COLUMN IF NOT EXISTS pride_tags TEXT[],
  ADD COLUMN IF NOT EXISTS player_model TEXT,
  ADD COLUMN IF NOT EXISTS film_links TEXT[],
  ADD COLUMN IF NOT EXISTS highlight_links TEXT[],
  ADD COLUMN IF NOT EXISTS other_socials TEXT,
  ADD COLUMN IF NOT EXISTS goal TEXT,
  ADD COLUMN IF NOT EXISTS colleges_interest TEXT,
  ADD COLUMN IF NOT EXISTS package_selected TEXT,
  ADD COLUMN IF NOT EXISTS consent_eval BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS consent_media BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS guardian_signature TEXT,
  ADD COLUMN IF NOT EXISTS signature_date DATE,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- Add constraint for payment_status if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'players_payment_status_check'
  ) THEN
    ALTER TABLE players ADD CONSTRAINT players_payment_status_check
      CHECK (payment_status IN ('pending', 'paid', 'failed'));
  END IF;
END $$;

-- ============================================================================
-- 2. Update PROJECTS table - Add missing columns for project management
-- ============================================================================
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS package_type TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS assigned_editor UUID REFERENCES staff_users(id),
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Migrate existing status values to new enum BEFORE adding constraint
UPDATE projects SET status = 'pending' WHERE status NOT IN ('pending', 'in_progress', 'review', 'completed', 'cancelled');

-- Add constraint for status if not exists (schema version mismatch)
-- First check if constraint exists with different values
DO $$
BEGIN
  -- Drop existing status check constraint if it has old values
  ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

  -- Add new constraint with correct values
  ALTER TABLE projects ADD CONSTRAINT projects_status_check
    CHECK (status IN ('pending', 'in_progress', 'review', 'completed', 'cancelled'));
END $$;

-- Add constraint for payment_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_payment_status_check'
  ) THEN
    ALTER TABLE projects ADD CONSTRAINT projects_payment_status_check
      CHECK (payment_status IN ('pending', 'paid', 'refunded', 'disputed'));
  END IF;
END $$;

-- Create index on package_type
CREATE INDEX IF NOT EXISTS idx_projects_package_type ON projects(package_type);

-- ============================================================================
-- 3. Update INTAKE_SUBMISSIONS table - Ensure all columns exist
-- ============================================================================
ALTER TABLE intake_submissions
  ADD COLUMN IF NOT EXISTS parent_name TEXT,
  ADD COLUMN IF NOT EXISTS parent_email TEXT,
  ADD COLUMN IF NOT EXISTS parent_phone TEXT,
  ADD COLUMN IF NOT EXISTS player_email TEXT,
  ADD COLUMN IF NOT EXISTS level TEXT,
  ADD COLUMN IF NOT EXISTS team_names TEXT,
  ADD COLUMN IF NOT EXISTS league_region TEXT,
  ADD COLUMN IF NOT EXISTS games_played INTEGER,
  ADD COLUMN IF NOT EXISTS ppg DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS apg DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS rpg DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS spg DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS bpg DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS fg_pct DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS three_pct DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS ft_pct DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS self_words TEXT,
  ADD COLUMN IF NOT EXISTS strength TEXT,
  ADD COLUMN IF NOT EXISTS improvement TEXT,
  ADD COLUMN IF NOT EXISTS separation TEXT,
  ADD COLUMN IF NOT EXISTS adversity_response TEXT,
  ADD COLUMN IF NOT EXISTS iq_self_rating TEXT,
  ADD COLUMN IF NOT EXISTS pride_tags TEXT[],
  ADD COLUMN IF NOT EXISTS player_model TEXT,
  ADD COLUMN IF NOT EXISTS film_links TEXT[],
  ADD COLUMN IF NOT EXISTS highlight_links TEXT[],
  ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
  ADD COLUMN IF NOT EXISTS other_socials TEXT,
  ADD COLUMN IF NOT EXISTS goal TEXT,
  ADD COLUMN IF NOT EXISTS colleges_interest TEXT,
  ADD COLUMN IF NOT EXISTS package_selected TEXT,
  ADD COLUMN IF NOT EXISTS consent_eval BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS consent_media BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS guardian_signature TEXT,
  ADD COLUMN IF NOT EXISTS signature_date DATE;

-- ============================================================================
-- 4. Update DELIVERABLES table - Ensure correct columns and constraints
-- ============================================================================

-- Check existing columns and add if missing
ALTER TABLE deliverables
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Update status constraint
DO $$
BEGIN
  ALTER TABLE deliverables DROP CONSTRAINT IF EXISTS deliverables_status_check;

  ALTER TABLE deliverables ADD CONSTRAINT deliverables_status_check
    CHECK (status IN ('pending', 'in_progress', 'ready_for_review', 'approved', 'delivered'));
END $$;

-- Update type constraint
DO $$
BEGIN
  ALTER TABLE deliverables DROP CONSTRAINT IF EXISTS deliverables_type_check;

  ALTER TABLE deliverables ADD CONSTRAINT deliverables_type_check
    CHECK (type IN ('written_evaluation', 'film_breakdown', 'social_clip', 'prospect_analysis', 'one_pager', 'verified_badge', 'tracking_profile', 'film_index', 'referral_note', 'mid_season_update', 'end_season_update'));
END $$;

-- ============================================================================
-- 5. Create REMINDERS table if it doesn't exist
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

-- Add missing columns if table already existed from partial run
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS reminder_type TEXT;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS sent BOOLEAN DEFAULT FALSE;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update reminder_type constraint if needed
DO $$
BEGIN
    ALTER TABLE reminders DROP CONSTRAINT IF EXISTS reminders_reminder_type_check;
    ALTER TABLE reminders ADD CONSTRAINT reminders_reminder_type_check
        CHECK (reminder_type IN ('mid_season_update', 'coach_followup', 'payment_reminder'));
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_reminders_project_id ON reminders(project_id);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled ON reminders(scheduled_date, sent);
CREATE INDEX IF NOT EXISTS idx_reminders_type ON reminders(reminder_type);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Allow access to staff
-- Drop if exists first (PostgreSQL doesn't support IF NOT EXISTS for policies)
DROP POLICY IF EXISTS "Allow reminders access to staff" ON reminders;

CREATE POLICY "Allow reminders access to staff" ON reminders
    FOR ALL USING (
        EXISTS (SELECT 1 FROM staff_users WHERE id::text = auth.uid()::text)
    );

-- ============================================================================
-- 6. Refresh Schema Cache
-- ============================================================================
-- This notifies PostgREST to refresh its schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- Migration Complete
-- ============================================================================
SELECT 'Schema migration completed successfully!' as status;
