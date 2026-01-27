-- 14_force_admin_access.sql
-- PURPOSE: Forcefully grant Admin Access to Sushil Bhai.
-- ORDER: 14 (Run ANY TIME)

-- 1. Sync User if missing (Safety Net)
INSERT INTO public.users (id, email, full_name, created_at, updated_at)
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'full_name', 
  created_at, 
  updated_at
FROM auth.users
WHERE email = 'sushilpatel7489@gmail.com' -- STRICT Match
ON CONFLICT (id) DO NOTHING;

-- 2. Force Update Role
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'sushilpatel7489@gmail.com';

-- 3. Force Insert into Admin Users Table
INSERT INTO public.admin_users (user_id)
SELECT id FROM public.users WHERE email = 'sushilpatel7489@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- 4. VERIFY RESULTS
SELECT id, email, role FROM public.users WHERE email = 'sushilpatel7489@gmail.com';
