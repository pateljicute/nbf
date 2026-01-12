-- FIX AND GRANT ADMIN ACCESS
-- Run this entire script in Supabase SQL Editor.

-- 1. Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid REFERENCES public.users(id) PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS for admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Admins are viewable by everyone (so we can check admin status)
DROP POLICY IF EXISTS "Admins are viewable by everyone." ON public.admin_users;
CREATE POLICY "Admins are viewable by everyone." ON public.admin_users FOR SELECT USING (true);

-- 4. Ensure user exists in public.users (Sync from auth.users if missing)
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

-- 5. Update role to 'admin' in public.users
UPDATE public.users
SET role = 'admin'
WHERE email = 'sushilpatel7489@gmail.com';

-- 6. Add to admin_users table
INSERT INTO public.admin_users (user_id)
SELECT id FROM public.users WHERE email = 'sushilpatel7489@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Verification
SELECT * FROM public.admin_users;
