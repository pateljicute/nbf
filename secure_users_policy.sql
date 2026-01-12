-- Secure Users Table Policy
-- Use this script to restrict access to user profiles.

-- 1. Drop existing "viewable by everyone" policy
drop policy if exists "Public profiles are viewable by everyone." on public.users;

-- 2. Create strict policy: Only the user themselves can view their own profile
create policy "Users can view their own profile."
  on public.users for select
  using ( auth.uid() = id );

-- 3. Ensure other policies exist (Idempotent check)
-- (Users can already insert/update their own profile from previous setup)
-- If they don't exist, here they are:
-- create policy "Users can insert their own profile." on public.users for insert with check ( auth.uid() = id );
-- create policy "Users can update own profile." on public.users for update using ( auth.uid() = id );
