-- Secure Users Table Policy (Fixed)

-- 1. Drop conflicting policies if they exist (to fix 42710 error)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile." ON public.users;

-- 2. Create strict policy: Only the user themselves can view their own profile
CREATE POLICY "Users can view their own profile."
  ON public.users FOR SELECT
  USING ( auth.uid() = id );

-- 3. Ensure other policies exist (Idempotent check/creation)
-- We use a DO block to check existence before creating to avoid errors for other policies if needed.
-- However, for simple setups, DROP IF EXISTS is cleanest if you want to enforce the definition.

-- Optional: If you need to re-define insert/update policies, uncomment below:
-- DROP POLICY IF EXISTS "Users can insert their own profile." ON public.users;
-- CREATE POLICY "Users can insert their own profile." ON public.users FOR INSERT WITH CHECK ( auth.uid() = id );

-- DROP POLICY IF EXISTS "Users can update own profile." ON public.users;
-- CREATE POLICY "Users can update own profile." ON public.users FOR UPDATE USING ( auth.uid() = id );
