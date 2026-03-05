-- ============================================================================
-- Fix RLS Policies for Cloudflare Functions Access
-- 
-- Problem: Cloudflare Functions use the anon key without Supabase Auth,
-- so auth.uid() is null and RLS policies block access.
-- 
-- Solution: Add policies that allow anonymous access for specific operations
-- while maintaining security through application-level controls.
-- ============================================================================

-- ============================================================================
-- 1. STAFF_USERS TABLE - Allow anonymous read for login
-- ============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow staff users read access" ON staff_users;
DROP POLICY IF EXISTS "Allow staff users update own" ON staff_users;

-- Allow anonymous SELECT for login (email/password verification)
-- Note: Application controls ensure only active users can login
CREATE POLICY "Allow anonymous staff_users read" ON staff_users
    FOR SELECT USING (TRUE);

-- Allow anonymous INSERT for initial setup
CREATE POLICY "Allow anonymous staff_users insert" ON staff_users
    FOR INSERT WITH CHECK (TRUE);

-- Allow updates for any authenticated request (JWT verified at app level)
CREATE POLICY "Allow staff_users update" ON staff_users
    FOR UPDATE USING (TRUE);

-- ============================================================================
-- 2. COACHES TABLE - Allow anonymous operations
-- ============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow coaches read access" ON coaches;
DROP POLICY IF EXISTS "Allow coaches update own" ON coaches;
DROP POLICY IF EXISTS "Allow coaches insert" ON coaches;

-- Allow anonymous SELECT for login and browsing
CREATE POLICY "Allow anonymous coaches read" ON coaches
    FOR SELECT USING (TRUE);

-- Allow anonymous INSERT for registration
CREATE POLICY "Allow anonymous coaches insert" ON coaches
    FOR INSERT WITH CHECK (TRUE);

-- Allow updates (application controls verify permissions)
CREATE POLICY "Allow coaches update" ON coaches
    FOR UPDATE USING (TRUE);

-- ============================================================================
-- 3. PLAYERS TABLE - Allow anonymous for intake form
-- ============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow players read access" ON players;
DROP POLICY IF EXISTS "Allow players insert" ON players;
DROP POLICY IF EXISTS "Allow players update by staff" ON players;

-- Allow anonymous SELECT (for public profiles)
CREATE POLICY "Allow anonymous players read" ON players
    FOR SELECT USING (TRUE);

-- Allow anonymous INSERT for intake form submissions
CREATE POLICY "Allow anonymous players insert" ON players
    FOR INSERT WITH CHECK (TRUE);

-- Allow updates (application controls verify permissions)
CREATE POLICY "Allow players update" ON players
    FOR UPDATE USING (TRUE);

-- ============================================================================
-- 4. PROJECTS TABLE - Allow anonymous for now (can be restricted later)
-- ============================================================================

DROP POLICY IF EXISTS "Allow projects access to staff" ON projects;

CREATE POLICY "Allow anonymous projects access" ON projects
    FOR ALL USING (TRUE);

-- ============================================================================
-- 5. DELIVERABLES TABLE - Allow anonymous for now
-- ============================================================================

DROP POLICY IF EXISTS "Allow deliverables access to staff" ON deliverables;

CREATE POLICY "Allow anonymous deliverables access" ON deliverables
    FOR ALL USING (TRUE);

-- ============================================================================
-- 6. PASSWORD_RESET_TOKENS - Allow anonymous
-- ============================================================================

DROP POLICY IF EXISTS "Allow reset tokens insert" ON password_reset_tokens;
DROP POLICY IF EXISTS "Allow reset tokens read own" ON password_reset_tokens;

CREATE POLICY "Allow anonymous reset tokens" ON password_reset_tokens
    FOR ALL USING (TRUE);

-- ============================================================================
-- 7. PAYMENT_TRANSACTIONS - Allow anonymous
-- ============================================================================

DROP POLICY IF EXISTS "Allow payment access to staff" ON payment_transactions;

CREATE POLICY "Allow anonymous payment access" ON payment_transactions
    FOR ALL USING (TRUE);

-- ============================================================================
-- 8. INTAKE_SUBMISSIONS - Allow anonymous
-- ============================================================================

DROP POLICY IF EXISTS "Allow intake submissions access to staff" ON intake_submissions;

CREATE POLICY "Allow anonymous intake access" ON intake_submissions
    FOR ALL USING (TRUE);

-- ============================================================================
-- 9. REMINDERS - Allow anonymous
-- ============================================================================

DROP POLICY IF EXISTS "Allow reminders access to staff" ON reminders;

CREATE POLICY "Allow anonymous reminders access" ON reminders
    FOR ALL USING (TRUE);

-- ============================================================================
-- 10. COACH_MESSAGES - Allow anonymous
-- ============================================================================

DROP POLICY IF EXISTS "Allow messages access to coaches" ON coach_messages;

CREATE POLICY "Allow anonymous messages access" ON coach_messages
    FOR ALL USING (TRUE);

-- ============================================================================
-- VERIFY FIX
-- ============================================================================
SELECT 'RLS policies updated for Cloudflare Functions access' as status;

-- Show current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
