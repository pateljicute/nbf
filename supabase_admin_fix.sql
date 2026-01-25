-- 1. Allow Admins to UPDATE public.users table
-- This is critical for Ban/Unban functionality if Service Role Key is missing.

CREATE POLICY "Admins can update users"
ON public.users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- 2. Allow Admins to READ public.users table (if not already allowed)
CREATE POLICY "Admins can read users"
ON public.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- 3. Verify Admin Table RLS (just in case)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read admin list"
ON public.admin_users
FOR SELECT
TO authenticated
USING (true); -- Or restrict to admins only, but public read is used for 'checkAdminStatus' logic currently.
