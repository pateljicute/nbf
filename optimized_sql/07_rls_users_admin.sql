-- 07_rls_users_admin.sql
-- PURPOSE: Secure user data with fast, non-recursive RLS policies.
-- ORDER: 7/12

-- 1. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 2. Users Table Policies
-- SELECT:
-- Everyone can read basics? Start with OPEN for simplicity in frontend
-- Ideally: Public users only see: id, name, avatar, profession.
-- But RLS is row-based. So we allow SELECT true.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR SELECT USING (true);

-- UPDATE:
-- Users can update their own profile.
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- ADMIN ACCESS:
-- Admins can update/delete anyone.
-- Uses is_admin() which is optimized to avoid recursion.
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;
CREATE POLICY "Admins can update all profiles" ON public.users FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.users;
CREATE POLICY "Admins can delete all profiles" ON public.users FOR DELETE USING (public.is_admin());

-- 3. Admin Users Table Policies
-- SELECT: Only admins can see who is an admin
DROP POLICY IF EXISTS "Admins viewable by admins only" ON public.admin_users;
CREATE POLICY "Admins viewable by admins only" ON public.admin_users FOR SELECT USING (public.is_admin());

-- INSERT/DELETE: Only service role or super admin (manually added) usually.
-- But for our logic, if an admin wants to add another admin:
DROP POLICY IF EXISTS "Admins can manage admins" ON public.admin_users;
CREATE POLICY "Admins can manage admins" ON public.admin_users FOR ALL USING (public.is_admin());
