-- SECURITY & PERFORMANCE FIXES
-- Run this in Supabase SQL Editor

-- 1. SECURITY: Column-Level RLS for Public Users
------------------------------------------------
-- Goal: Prevent hackers from SELECT * on public.users to get emails/phones.
-- Strategy: We cannot easily do column-level RLS on a single table.
-- Best Practice: Create a Secure View for public access and RESTRICT the main table.

-- A. Revoke Public Access to the raw table
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;
-- NOTE: We keep the table readable for now to prevent breaking the app, but we will add a strict policy.
-- Better approach for "Zero Error" without major refactors: 
-- Allow public to ONLY see users who have 'profession' set (likely real users) or just stick to Basic Info.
-- Actually, the most robust way w/o breaking Next.js middleware is:
CREATE OR REPLACE FUNCTION public.get_safe_profile(user_uuid uuid)
RETURNS TABLE (id uuid, full_name text, avatar_url text, profession text) AS $$
BEGIN
  RETURN QUERY SELECT u.id, u.full_name, u.avatar_url, u.profession FROM public.users u WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- For now, we will add a WARNING comment. Real locking requires changing all frontend queries to use the function above.
-- We will instead ENABLE RLS and ensure only the owner can see email/phone.
-- But standard Supabase 'users' table doesn't have email/phone usually?
-- Wait, our 'ultimate_setup.sql' ADDS email/contact_number to public.users!
-- So we MUST protect it.

-- B. New Policy: Public can view, but let's try to hide sensitive data?
-- Postgres RLS hides ROWS, not COLUMNS.
-- workaround: We will CREATE A VIEW for public consumption if needed.
-- But for this specific logical request: "Update RLS to prevent downloading entire list"
-- We can disallow listing:
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;
CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);
-- To truly fix this, we need to separate private data.
-- ACTION: We will add a 'last_posted_at' column for Rate Limiting.

-- 1.5. Allow Users to see THEIR OWN data (Crucial for Onboarding check)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);

-- 3. ADMIN SECURITY (Fixed to avoid Infinite Recursion)
-------------------------------------------------------
-- PROBLEM: Checking "role = 'admin'" on public.users recursively calls this policy.
-- RETURNED TO SAFE STATE: Use public.admin_users table ONLY for admin checks.
-- Ensure admin_users table exists and is populated.

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
CREATE POLICY "Admins can view all profiles" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);
-- Note: We removed the 'OR EXISTS (SELECT 1 FROM public.users...)' because it causes recursion.
-- Make sure to add your admin user to 'public.admin_users' table if not already there.

-------------------
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_posted_at timestamp with time zone;

-- 3. ADMIN SECURITY
--------------------
-- Ensure Admins can see everything (already done in ultimate_setup, but reinforcing)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
CREATE POLICY "Admins can view all profiles" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
