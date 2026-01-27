-- 02_users_and_auth.sql
-- PURPOSE: Define user structures and synchronization with Supabase Auth.
-- ORDER: 2/12

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name text,
  email text,
  contact_number text,
  avatar_url text,
  profession text, -- Support for user onboarding
  role text DEFAULT 'user', -- 'user' or 'admin'
  status text DEFAULT 'active', -- 'active', 'banned'
  is_verified boolean DEFAULT false,
  is_banned boolean DEFAULT false, -- Explicit ban flag for performance
  last_posted_at timestamp with time zone, -- Anti-spam rate limiting
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Admin Users Table
-- Serves as a hard-coded list of admins for high-security checks
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Auth Sync Trigger (Supabase Auth -> Public Users)
-- Automatically creates a public user record when a user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = MOALESCE(public.users.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(public.users.avatar_url, EXCLUDED.avatar_url);
    
  RETURN new;
END;
$$;

-- Drop existing trigger if it exists to ensure clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
AFTER INSERT ON auth.users 
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Sync Existing Users (One-time repair)
-- Should act as a fallback for users who might have signed up but have no public record
INSERT INTO public.users (id, email, full_name, created_at, updated_at)
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'full_name', 
  created_at, 
  updated_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;
