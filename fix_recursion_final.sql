-- FIX INFINITE RECURSION ERROR (FINAL)
-- Run this in Supabase SQL Editor to STOP the "infinite recursion" error.

-- 1. Drop ALL potentially recursive policies on 'users' table
-- (Any policy that selects from 'users' typically causes this)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Admins are viewable by everyone." ON public.admin_users; -- cleanup

-- 2. Create SAFE Policies
-- A. Public Access: Simple "TRUE" check (No queries, No recursion)
-- This allows Property Cards to show owner names.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;
CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);

-- B. User Self Access: Simple matches ID (No recursion)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.users;
CREATE POLICY "Users can update own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.users;
CREATE POLICY "Users can insert their own profile." ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- C. Admin Access: Use 'admin_users' table ONLY (Breaks recursion)
-- We do NOT check public.users.role inside this policy.
CREATE POLICY "Admins can update all profiles" ON public.users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- 3. Rate Limiting Column (Ensure it exists)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_posted_at timestamp with time zone;

-- 4. Sync Admin List (Ensure you are an admin in the safe table)
INSERT INTO public.admin_users (user_id)
SELECT id FROM public.users WHERE email = 'sushilpatel7489@gmail.com'
ON CONFLICT (user_id) DO NOTHING;
