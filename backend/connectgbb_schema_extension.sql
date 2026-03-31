-- ============================================================================
-- ConnectGBB Schema Extensions (Membership, Training, Community, Messaging)
-- Run after base supabase_schema.sql and community_schema.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. MEMBER PROFILES (auth.users linked)
-- ============================================================================
CREATE TABLE IF NOT EXISTS member_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('player', 'parent', 'coach', 'organizer')),
    display_name TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    player_id UUID REFERENCES players(id) ON DELETE SET NULL,
    coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
    guardian_of_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
    privacy_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_member_profiles_auth_user_id ON member_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_member_profiles_role ON member_profiles(role);
CREATE INDEX IF NOT EXISTS idx_member_profiles_player_id ON member_profiles(player_id);

ALTER TABLE member_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members manage own profile" ON member_profiles;
CREATE POLICY "Members manage own profile" ON member_profiles
    FOR ALL USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Members create own profile" ON member_profiles;
CREATE POLICY "Members create own profile" ON member_profiles
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Staff view member profiles" ON member_profiles;
CREATE POLICY "Staff view member profiles" ON member_profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM staff_users WHERE id::text = auth.uid()::text)
    );

-- ============================================================================
-- 2. MEMBERSHIPS
-- ============================================================================
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'development', 'elite')),
    status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'canceled', 'past_due')),
    billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    trial_end TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memberships_member_id ON memberships(member_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view own memberships" ON memberships;
CREATE POLICY "Members view own memberships" ON memberships
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM member_profiles WHERE id = memberships.member_id AND auth_user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Members create memberships" ON memberships;
CREATE POLICY "Members create memberships" ON memberships
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM member_profiles WHERE id = memberships.member_id AND auth_user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Staff manage memberships" ON memberships;
CREATE POLICY "Staff manage memberships" ON memberships
    FOR ALL USING (
        EXISTS (SELECT 1 FROM staff_users WHERE id::text = auth.uid()::text)
    );

-- ============================================================================
-- 3. TRAINING CONTENT & PROGRESS
-- ============================================================================
CREATE TABLE IF NOT EXISTS training_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES training_categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL CHECK (content_type IN ('video', 'drill', 'pdf', 'clinic')),
    level TEXT,
    position_tags TEXT[],
    duration_seconds INTEGER,
    media_url TEXT,
    thumbnail_url TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES staff_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_content_category ON training_content(category_id);
CREATE INDEX IF NOT EXISTS idx_training_content_type ON training_content(content_type);
CREATE INDEX IF NOT EXISTS idx_training_content_level ON training_content(level);

ALTER TABLE training_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published training visible" ON training_content;
CREATE POLICY "Published training visible" ON training_content
    FOR SELECT USING (is_published = TRUE);

DROP POLICY IF EXISTS "Staff manage training content" ON training_content;
CREATE POLICY "Staff manage training content" ON training_content
    FOR ALL USING (
        EXISTS (SELECT 1 FROM staff_users WHERE id::text = auth.uid()::text)
    );

CREATE TABLE IF NOT EXISTS training_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES training_content(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
    progress_percent INTEGER DEFAULT 0,
    last_watched_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_training_progress UNIQUE (member_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_training_progress_member ON training_progress(member_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_content ON training_progress(content_id);

ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members manage own progress" ON training_progress;
CREATE POLICY "Members manage own progress" ON training_progress
    FOR ALL USING (
        EXISTS (SELECT 1 FROM member_profiles WHERE id = training_progress.member_id AND auth_user_id = auth.uid())
    );

CREATE TABLE IF NOT EXISTS training_playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_playlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_id UUID NOT NULL REFERENCES training_playlists(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES training_content(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_playlist_item UNIQUE (playlist_id, content_id)
);

ALTER TABLE training_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_playlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members manage playlists" ON training_playlists;
CREATE POLICY "Members manage playlists" ON training_playlists
    FOR ALL USING (
        EXISTS (SELECT 1 FROM member_profiles WHERE id = training_playlists.member_id AND auth_user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Members manage playlist items" ON training_playlist_items;
CREATE POLICY "Members manage playlist items" ON training_playlist_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM training_playlists tp
                JOIN member_profiles mp ON tp.member_id = mp.id
                WHERE tp.id = training_playlist_items.playlist_id AND mp.auth_user_id = auth.uid())
    );

-- ============================================================================
-- 4. CONNECTION REQUESTS + MESSAGING
-- ============================================================================
CREATE TABLE IF NOT EXISTS connection_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'revoked')),
    guardian_approval_required BOOLEAN DEFAULT FALSE,
    guardian_approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_connection_request UNIQUE (requester_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_connection_requests_target ON connection_requests(target_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status ON connection_requests(status);

ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members manage connection requests" ON connection_requests;
CREATE POLICY "Members manage connection requests" ON connection_requests
    FOR ALL USING (
        EXISTS (
          SELECT 1 FROM member_profiles mp
          WHERE mp.auth_user_id = auth.uid()
            AND (mp.id = connection_requests.requester_id OR mp.id = connection_requests.target_id)
        )
    );

CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'blocked', 'deleted')),
    guardian_approval_required BOOLEAN DEFAULT FALSE,
    guardian_approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient ON direct_messages(recipient_id);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members manage direct messages" ON direct_messages;
CREATE POLICY "Members manage direct messages" ON direct_messages
    FOR ALL USING (
        EXISTS (
          SELECT 1 FROM member_profiles mp
          WHERE mp.auth_user_id = auth.uid()
            AND (mp.id = direct_messages.sender_id OR mp.id = direct_messages.recipient_id)
        )
    );

-- ============================================================================
-- 5. EVENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID REFERENCES member_profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE,
    event_type TEXT NOT NULL CHECK (event_type IN ('clinic', 'showcase', 'webinar', 'combine', 'camp')),
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_rsvps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'waitlist', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_event_rsvp UNIQUE (event_id, member_id)
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published events visible" ON events;
CREATE POLICY "Published events visible" ON events
    FOR SELECT USING (is_published = TRUE);

DROP POLICY IF EXISTS "Members manage rsvps" ON event_rsvps;
CREATE POLICY "Members manage rsvps" ON event_rsvps
    FOR ALL USING (
        EXISTS (SELECT 1 FROM member_profiles WHERE id = event_rsvps.member_id AND auth_user_id = auth.uid())
    );

-- ============================================================================
-- 6. COACH ENDORSEMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS coach_endorsements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_profile_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
    player_profile_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'revoked')),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_endorsement UNIQUE (coach_profile_id, player_profile_id)
);

ALTER TABLE coach_endorsements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members manage endorsements" ON coach_endorsements;
CREATE POLICY "Members manage endorsements" ON coach_endorsements
    FOR ALL USING (
        EXISTS (
          SELECT 1 FROM member_profiles mp
          WHERE mp.auth_user_id = auth.uid()
            AND (mp.id = coach_endorsements.coach_profile_id OR mp.id = coach_endorsements.player_profile_id)
        )
    );

-- ============================================================================
-- 7. SAFETY REPORTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS safety_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL CHECK (report_type IN ('message', 'post', 'profile', 'event')),
    target_id UUID,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    details TEXT,
    reviewed_by UUID REFERENCES staff_users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE safety_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members create safety reports" ON safety_reports;
CREATE POLICY "Members create safety reports" ON safety_reports
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM member_profiles WHERE id = safety_reports.reporter_id AND auth_user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Staff manage safety reports" ON safety_reports;
CREATE POLICY "Staff manage safety reports" ON safety_reports
    FOR ALL USING (
        EXISTS (SELECT 1 FROM staff_users WHERE id::text = auth.uid()::text)
    );

-- ============================================================================
-- Refresh schema cache
-- ============================================================================
NOTIFY pgrst, 'reload schema';

SELECT 'ConnectGBB schema extensions created successfully!' as status;
