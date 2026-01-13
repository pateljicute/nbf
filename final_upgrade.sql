-- FINAL UPGRADE SQL (Combined Fix: Recursion + Admin Access)
-- Run this ENTIRE SCRIPT in Supabase SQL Editor

-- 1. DROP PROBLEM POLICIES (Recursion Fix)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile." ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.users;
DROP POLICY IF EXISTS "Admins are viewable by everyone." ON public.admin_users;

-- 2. SETUP ADMIN TABLE & USER (Admin Grant Logic)
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Allow public to see WHO is an admin (needed for some frontend checks)
CREATE POLICY "Admins are viewable by everyone." ON public.admin_users FOR SELECT USING (true);

-- FORCE SYNC: Ensure the admin user exists in public.users
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

-- UPDATE ROLE: Set role to 'admin' in public.users (Legacy support)
UPDATE public.users
SET role = 'admin'
WHERE email = 'sushilpatel7489@gmail.com';

-- GRANT ACCESS: Add to admin_users table (New Secure Auth)
INSERT INTO public.admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'sushilpatel7489@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- 3. CREATE SAFE POLICIES (No Recursion)
-- A. PUBLIC: Allow reading basic info
CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);

-- B. SELF: Allow users to see/edit their own data
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile." ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- C. ADMIN: Uses 'admin_users' table ONLY (Breaks recursion)
CREATE POLICY "Admins can update all profiles" ON public.users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- 4. RATE LIMITING
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_posted_at timestamp with time zone;

SELECT 'Success: Recursion Fixed & Admin Access Granted' as status;
