-- ═══════════════════════════════════════════════════════════════
-- NBF Homes — Grant Admin Access
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ═══════════════════════════════════════════════════════════════

-- STEP 1: Find your User ID by email
-- (Replace with your actual email)
SELECT id AS your_user_id, email, created_at
FROM auth.users 
WHERE email = 'REPLACE_WITH_YOUR_EMAIL@example.com';

-- ---------------------------------------------------------------
-- STEP 2: Add yourself as admin using your email (easier method)
-- Replace the email below with your actual email
-- ---------------------------------------------------------------
INSERT INTO admin_users (user_id)
SELECT id 
FROM auth.users 
WHERE email = 'REPLACE_WITH_YOUR_EMAIL@example.com'
ON CONFLICT (user_id) DO NOTHING;

-- ---------------------------------------------------------------
-- OR: If you know your User ID directly, paste it here:
-- ---------------------------------------------------------------
-- INSERT INTO admin_users (user_id)
-- VALUES ('PASTE-YOUR-UUID-HERE')
-- ON CONFLICT (user_id) DO NOTHING;

-- ---------------------------------------------------------------
-- STEP 3: Verify it worked
-- ---------------------------------------------------------------
SELECT 
    au.user_id,
    u.email,
    u.created_at AS user_created,
    au.created_at AS admin_since
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
ORDER BY au.created_at DESC;
