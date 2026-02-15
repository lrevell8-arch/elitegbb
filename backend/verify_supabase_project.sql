-- ============================================================================
-- Verify You're Using the Correct Supabase Project
-- Run this in the SQL Editor to confirm you're connected to:
-- "hoopwithherbasketball-lab's Project" (NOT "HWH Player Advantage")
-- ============================================================================

-- Check project info
SELECT 
    'Database Info' as check_type,
    current_database() as database_name,
    current_user as current_user,
    version() as postgres_version;

-- Check if coaches table exists and has all required columns
SELECT 
    'Coaches Table' as check_type,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'coaches' 
ORDER BY ordinal_position;

-- Check if players table exists
SELECT 
    'Players Table' as check_type,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'players' 
ORDER BY ordinal_position
LIMIT 5;

-- Check if staff_users table exists
SELECT 
    'Staff Users Table' as check_type,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'staff_users' 
ORDER BY ordinal_position;

-- Count records in each table (to verify it's the robust database)
SELECT 'coaches' as table_name, COUNT(*) as record_count FROM coaches
UNION ALL
SELECT 'players', COUNT(*) FROM players
UNION ALL
SELECT 'staff_users', COUNT(*) FROM staff_users
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'payment_transactions', COUNT(*) FROM payment_transactions;
