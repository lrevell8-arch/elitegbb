-- ============================================================================
-- Community Feature Schema for EliteGBB
-- Adds forum/community functionality to the platform
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. Create COMMUNITY_POSTS table
-- ============================================================================
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    tags TEXT[],
    attachments TEXT[], -- Array of URLs for images/videos
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active', -- active, hidden, deleted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraints
ALTER TABLE community_posts
    ADD CONSTRAINT community_posts_category_check
        CHECK (category IN ('general', 'training', 'recruiting', 'game_analysis', 'motivation', 'announcements', 'q_and_a')),
    ADD CONSTRAINT community_posts_status_check
        CHECK (status IN ('active', 'hidden', 'deleted'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_status ON community_posts(status);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_pinned ON community_posts(is_pinned, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_featured ON community_posts(is_featured, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_activity ON community_posts(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_tags ON community_posts USING GIN(tags);

-- Enable RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- Allow authors to manage their own posts
DROP POLICY IF EXISTS "Users can manage their own posts" ON community_posts;
CREATE POLICY "Users can manage their own posts" ON community_posts
    FOR ALL USING (author_id::text = auth.uid()::text);

-- Allow anyone to view active posts
DROP POLICY IF EXISTS "Anyone can view active posts" ON community_posts;
CREATE POLICY "Anyone can view active posts" ON community_posts
    FOR SELECT USING (status = 'active');

-- Allow staff full access
DROP POLICY IF EXISTS "Staff full access to posts" ON community_posts;
CREATE POLICY "Staff full access to posts" ON community_posts
    FOR ALL USING (
        EXISTS (SELECT 1 FROM staff_users WHERE id::text = auth.uid()::text)
    );

-- ============================================================================
-- 2. Create COMMUNITY_COMMENTS table
-- ============================================================================
CREATE TABLE IF NOT EXISTS community_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES community_comments(id) ON DELETE CASCADE, -- For threaded replies
    content TEXT NOT NULL,
    attachments TEXT[],
    likes_count INTEGER DEFAULT 0,
    is_accepted_answer BOOLEAN DEFAULT FALSE, -- For Q&A posts
    status TEXT DEFAULT 'active', -- active, hidden, deleted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraints
ALTER TABLE community_comments
    ADD CONSTRAINT community_comments_status_check
        CHECK (status IN ('active', 'hidden', 'deleted'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_author ON community_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_parent ON community_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_status ON community_comments(status);
CREATE INDEX IF NOT EXISTS idx_community_comments_created ON community_comments(created_at);

-- Enable RLS
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

-- Allow authors to manage their own comments
DROP POLICY IF EXISTS "Users can manage their own comments" ON community_comments;
CREATE POLICY "Users can manage their own comments" ON community_comments
    FOR ALL USING (author_id::text = auth.uid()::text);

-- Allow anyone to view active comments
DROP POLICY IF EXISTS "Anyone can view active comments" ON community_comments;
CREATE POLICY "Anyone can view active comments" ON community_comments
    FOR SELECT USING (status = 'active');

-- Allow staff full access
DROP POLICY IF EXISTS "Staff full access to comments" ON community_comments;
CREATE POLICY "Staff full access to comments" ON community_comments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM staff_users WHERE id::text = auth.uid()::text)
    );

-- ============================================================================
-- 3. Create COMMUNITY_REACTIONS table (Likes, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS community_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL DEFAULT 'like',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure either post_id or comment_id is set, but not both
    CONSTRAINT check_reaction_target CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    ),
    -- One reaction per user per target
    CONSTRAINT unique_user_post_reaction UNIQUE (user_id, post_id),
    CONSTRAINT unique_user_comment_reaction UNIQUE (user_id, comment_id)
);

-- Add constraint for reaction types
ALTER TABLE community_reactions
    ADD CONSTRAINT community_reactions_type_check
        CHECK (reaction_type IN ('like', 'love', 'support', 'insightful', 'celebrate'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_community_reactions_user ON community_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_community_reactions_post ON community_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_community_reactions_comment ON community_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_community_reactions_type ON community_reactions(reaction_type);

-- Enable RLS
ALTER TABLE community_reactions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own reactions
DROP POLICY IF EXISTS "Users manage own reactions" ON community_reactions;
CREATE POLICY "Users manage own reactions" ON community_reactions
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Staff can view all reactions
DROP POLICY IF EXISTS "Staff can view all reactions" ON community_reactions;
CREATE POLICY "Staff can view all reactions" ON community_reactions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM staff_users WHERE id::text = auth.uid()::text)
    );

-- ============================================================================
-- 4. Create COMMUNITY_NOTIFICATIONS table
-- ============================================================================
CREATE TABLE IF NOT EXISTS community_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    related_comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES players(id) ON DELETE SET NULL, -- Who triggered the notification
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraints
ALTER TABLE community_notifications
    ADD CONSTRAINT community_notifications_type_check
        CHECK (notification_type IN ('post_like', 'comment', 'reply', 'mention', 'featured_post', 'announcement'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_community_notifications_user ON community_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_community_notifications_unread ON community_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_community_notifications_created ON community_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE community_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
DROP POLICY IF EXISTS "Users see own notifications" ON community_notifications;
CREATE POLICY "Users see own notifications" ON community_notifications
    FOR ALL USING (user_id::text = auth.uid()::text);

-- ============================================================================
-- 5. Create COMMUNITY_SAVES table (Saved/Bookmarked posts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS community_saves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_save UNIQUE (user_id, post_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_community_saves_user ON community_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_community_saves_post ON community_saves(post_id);

-- Enable RLS
ALTER TABLE community_saves ENABLE ROW LEVEL SECURITY;

-- Users manage their own saves
DROP POLICY IF EXISTS "Users manage own saves" ON community_saves;
CREATE POLICY "Users manage own saves" ON community_saves
    FOR ALL USING (user_id::text = auth.uid()::text);

-- ============================================================================
-- 6. Create COMMUNITY_REPORTS table (Content moderation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS community_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
    reviewed_by UUID REFERENCES staff_users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_report_target CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    )
);

-- Add constraints
ALTER TABLE community_reports
    ADD CONSTRAINT community_reports_reason_check
        CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'misinformation', 'other')),
    ADD CONSTRAINT community_reports_status_check
        CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_community_reports_status ON community_reports(status);
CREATE INDEX IF NOT EXISTS idx_community_reports_post ON community_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_community_reports_comment ON community_reports(comment_id);
CREATE INDEX IF NOT EXISTS idx_community_reports_created ON community_reports(created_at);

-- Enable RLS
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;

-- Users can create their own reports
DROP POLICY IF EXISTS "Users create own reports" ON community_reports;
CREATE POLICY "Users create own reports" ON community_reports
    FOR INSERT WITH CHECK (reporter_id::text = auth.uid()::text);

-- Users can view their own reports
DROP POLICY IF EXISTS "Users view own reports" ON community_reports;
CREATE POLICY "Users view own reports" ON community_reports
    FOR SELECT USING (reporter_id::text = auth.uid()::text);

-- Staff full access
DROP POLICY IF EXISTS "Staff full access to reports" ON community_reports;
CREATE POLICY "Staff full access to reports" ON community_reports
    FOR ALL USING (
        EXISTS (SELECT 1 FROM staff_users WHERE id::text = auth.uid()::text)
    );

-- ============================================================================
-- 7. Create functions for updating counts and timestamps
-- ============================================================================

-- Function to update post comment count
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE community_posts 
        SET comments_count = comments_count + 1,
            last_activity_at = NOW()
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status != 'active') THEN
        UPDATE community_posts 
        SET comments_count = GREATEST(0, comments_count - 1)
        WHERE id = COALESCE(NEW.post_id, OLD.post_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comment count
DROP TRIGGER IF EXISTS trigger_update_post_comment_count ON community_comments;
CREATE TRIGGER trigger_update_post_comment_count
    AFTER INSERT OR DELETE OR UPDATE ON community_comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- Function to update post likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_posts 
        SET likes_count = likes_count + 1,
            last_activity_at = NOW()
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_posts 
        SET likes_count = GREATEST(0, likes_count - 1)
        WHERE id = OLD.post_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for post likes
DROP TRIGGER IF EXISTS trigger_update_post_likes ON community_reactions;
CREATE TRIGGER trigger_update_post_likes
    AFTER INSERT OR DELETE ON community_reactions
    FOR EACH ROW
    WHEN (NEW.post_id IS NOT NULL OR OLD.post_id IS NOT NULL)
    EXECUTE FUNCTION update_post_likes_count();

-- Function to update comment likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_comments 
        SET likes_count = likes_count + 1
        WHERE id = NEW.comment_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_comments 
        SET likes_count = GREATEST(0, likes_count - 1)
        WHERE id = OLD.comment_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comment likes
DROP TRIGGER IF EXISTS trigger_update_comment_likes ON community_reactions;
CREATE TRIGGER trigger_update_comment_likes
    AFTER INSERT OR DELETE ON community_reactions
    FOR EACH ROW
    WHEN (NEW.comment_id IS NOT NULL OR OLD.comment_id IS NOT NULL)
    EXECUTE FUNCTION update_comment_likes_count();

-- Function to update post updated_at timestamp
CREATE OR REPLACE FUNCTION update_post_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for post updates
DROP TRIGGER IF EXISTS trigger_update_post_timestamp ON community_posts;
CREATE TRIGGER trigger_update_post_timestamp
    BEFORE UPDATE ON community_posts
    FOR EACH ROW EXECUTE FUNCTION update_post_timestamp();

-- Function to update comment updated_at timestamp
CREATE OR REPLACE FUNCTION update_comment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comment updates
DROP TRIGGER IF EXISTS trigger_update_comment_timestamp ON community_comments;
CREATE TRIGGER trigger_update_comment_timestamp
    BEFORE UPDATE ON community_comments
    FOR EACH ROW EXECUTE FUNCTION update_comment_timestamp();

-- ============================================================================
-- 8. Create notification trigger function
-- ============================================================================

-- Function to create notification on comment
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
    post_author_id UUID;
    parent_author_id UUID;
BEGIN
    -- Get post author
    SELECT author_id INTO post_author_id 
    FROM community_posts WHERE id = NEW.post_id;
    
    -- Notify post author of new comment (if not the commenter)
    IF post_author_id != NEW.author_id THEN
        INSERT INTO community_notifications (
            user_id, notification_type, title, message,
            related_post_id, related_comment_id, actor_id
        ) VALUES (
            post_author_id, 'comment', 'New Comment', 
            'Someone commented on your post',
            NEW.post_id, NEW.id, NEW.author_id
        );
    END IF;
    
    -- If this is a reply, notify parent comment author
    IF NEW.parent_id IS NOT NULL THEN
        SELECT author_id INTO parent_author_id
        FROM community_comments WHERE id = NEW.parent_id;
        
        IF parent_author_id != NEW.author_id AND parent_author_id != post_author_id THEN
            INSERT INTO community_notifications (
                user_id, notification_type, title, message,
                related_post_id, related_comment_id, actor_id
            ) VALUES (
                parent_author_id, 'reply', 'New Reply',
                'Someone replied to your comment',
                NEW.post_id, NEW.id, NEW.author_id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comment notifications
DROP TRIGGER IF EXISTS trigger_create_comment_notification ON community_comments;
CREATE TRIGGER trigger_create_comment_notification
    AFTER INSERT ON community_comments
    FOR EACH ROW EXECUTE FUNCTION create_comment_notification();

-- Function to create notification on like
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
    target_author_id UUID;
    target_post_id UUID;
BEGIN
    -- Determine target (post or comment)
    IF NEW.post_id IS NOT NULL THEN
        target_post_id := NEW.post_id;
        SELECT author_id INTO target_author_id
        FROM community_posts WHERE id = NEW.post_id;
    ELSE
        SELECT post_id, author_id INTO target_post_id, target_author_id
        FROM community_comments WHERE id = NEW.comment_id;
    END IF;
    
    -- Notify author of like (if not self-like)
    IF target_author_id != NEW.user_id THEN
        INSERT INTO community_notifications (
            user_id, notification_type, title, message,
            related_post_id, actor_id
        ) VALUES (
            target_author_id, 'post_like', 'New Like',
            'Someone liked your post',
            target_post_id, NEW.user_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for like notifications
DROP TRIGGER IF EXISTS trigger_create_like_notification ON community_reactions;
CREATE TRIGGER trigger_create_like_notification
    AFTER INSERT ON community_reactions
    FOR EACH ROW EXECUTE FUNCTION create_like_notification();

-- ============================================================================
-- 9. Update players table to track community engagement
-- ============================================================================
ALTER TABLE players
    ADD COLUMN IF NOT EXISTS community_reputation INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS community_posts_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS community_joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================================================
-- 10. Refresh Schema Cache
-- ============================================================================
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- Migration Complete
-- ============================================================================
SELECT 'Community feature schema created successfully!' as status;
