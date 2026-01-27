-- FIX USER DATA SYNC (Email & Phone)
-- Run this in Supabase SQL Editor to populate missing data.

-- 1. Ensure columns exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email text;

-- 2. SYNC FROM AUTH.USERS (The Source of Truth)
-- Update public.users with Email and Phone from the secure auth.users table
UPDATE public.users
SET 
  email = auth.users.email,
  phone_number = COALESCE(auth.users.phone, auth.users.raw_user_meta_data->>'phone_number', auth.users.raw_user_meta_data->>'contact_number')
FROM auth.users
WHERE public.users.id = auth.users.id;

-- 3. Fallback: If phone_number is still null, try using existing contact_number from public.users
UPDATE public.users 
SET phone_number = contact_number 
WHERE phone_number IS NULL AND contact_number IS NOT NULL;

-- 4. Verification Check
SELECT id, email, phone_number, contact_number FROM public.users;
