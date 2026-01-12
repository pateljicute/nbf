-- ==============================================================================
-- AUTH SYNC & SETTINGS SCRIPT
-- ==============================================================================

-- 1. SYNC TRIGGER (Auth -> Public)
-- This ensures that whenever a new user signs up via Supabase Auth,
-- they are immediately created in public.users to avoid Foreign Key errors.

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
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    updated_at = now();
  RETURN new;
END;
$$;

-- Re-create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. WHATSAPP SETTINGS
-- Check and create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON public.site_settings
    FOR SELECT USING (true);

-- Allow admin update (assuming admin check involves checking auth.uid() against admin_users)
-- For simplicity in this fix, we will allow anyone to read, but we need to ensure we can insert.
-- We will rely on the script running as a migration/Superuser in SQL editor which bypasses RLS for the INSERT below.

-- Add the group link and number
INSERT INTO public.site_settings (key, value)
VALUES 
  ('whatsapp_group_link', 'https://whatsapp.com/channel/0029Vb7ZqswLtOjF8AQiBL19'),
  ('whatsapp_number', '7470724553')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- 3. SYNC EXISTING USERS (One-time fix)
-- Ensure all current auth users exist in public.users
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

-- Verification
SELECT * FROM public.site_settings WHERE key LIKE 'whatsapp%';
