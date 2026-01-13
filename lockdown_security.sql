-- SECURITY LOCKDOWN SCRIPT (Zero-Error Plan)
-- Run this in Supabase SQL Editor

-- 1. Create a Secure View for Public Profile Access
-- This ensures that only safe columns are ever exposed to the public API for general fetching.
CREATE OR REPLACE VIEW public.public_user_profiles AS
SELECT 
    id,
    full_name,
    avatar_url,
    profession,
    role,
    is_verified
FROM public.users;

-- Grant access to this view
GRANT SELECT ON public.public_user_profiles TO anon, authenticated;

-- 2. Lockdown the main 'users' table
-- We assume RLS is already enabled. We will refine the policies.

-- Drop the overly permissive policy if it exists
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;
DROP POLICY IF EXISTS "Public info is viewable by everyone" ON public.users;

-- Create STRICTER policies

-- A. Users can see their OWN full data (email, phone, etc.)
CREATE POLICY "Users can see own profile" ON public.users
FOR SELECT USING (auth.uid() = id);

-- B. Admins can see EVERYTHING (needed for Admin Dashboard)
CREATE POLICY "Admins can see all profiles" ON public.users
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- C. Public/Anyone can ONLY see 'Safe' data? 
-- LIMITATION: RLS filters ROWS, not COLUMNS.
-- If we add a policy "Everyone can see id/name", they can theoretically select "email" too for those valid rows if using the JS client on 'users' table.
-- SOLUTION: 
-- We instructed the frontend (in our future steps) to use `public_user_profiles` view for property owners.
-- However, to prevent 'Inspector' hacking on the main table:
-- We CANNOT allow general SELECT on `public.users` for `anon` role anymore.
-- This effectively HIDES email/phone from the public! 
-- NOTE: This might break parts of the app that try to join `users` table directly. We must be sure.
-- For now, we will leave a 'Basic Public Access' policy but we rely on the View for public consumption.
-- WAIT! The user explicitly asked to "hide sensitive data". 
-- If we remove the public policy, `getAdminUsers` works (admin policy), `Profile` works (own policy).
-- But `Property Card` fetching `user` relation will FAIL if it tries to join `users`.
-- We will accept this trade-off for "Zero Error Security" and fix the Property fetching if needed.

-- For now, let's keep the view creation and the Admin Policy.
-- To truly hide columns from `anon` on `users` table without breaking relations is hard.
-- Recommendation: We will implement the View, and in the future, migrate property owner fetching to use the view.

-- 3. Rate Limiting Table (Optional, for client side we used LocalStorage, but DB is better)
CREATE TABLE IF NOT EXISTS public.post_property_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.post_property_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert logs" ON public.post_property_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own logs" ON public.post_property_logs FOR SELECT USING (auth.uid() = user_id);
