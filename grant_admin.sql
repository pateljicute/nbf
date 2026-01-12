-- GRANT ADMIN ACCESS TO sushilpatel7489@gmail.com
-- Run this in the Supabase SQL Editor

-- 1. Ensure user exists in public.users (Sync from auth.users if missing)
INSERT INTO public.users (id, email, full_name, created_at, updated_at)
SELECT 
    id, 
    email, 
    raw_user_meta_data->>'full_name',
    created_at,
    updated_at
FROM auth.users
WHERE email = 'sushilpatel7489@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- 2. Update role to 'admin' in public.users
UPDATE public.users
SET role = 'admin'
WHERE email = 'sushilpatel7489@gmail.com';

-- 3. Add to admin_users table
INSERT INTO public.admin_users (user_id)
SELECT id FROM public.users WHERE email = 'sushilpatel7489@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Verification
SELECT * FROM public.users WHERE email = 'sushilpatel7489@gmail.com';
