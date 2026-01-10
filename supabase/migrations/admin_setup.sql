-- Admin Setup Script for Sushil (Fixed)
-- Run this in the Supabase SQL Editor

-- 1. Ensure User Exists in public.users
-- This fixes the "violates foreign key constraint" error by creating the user record first
INSERT INTO public.users (id, email, full_name, role, is_verified) 
VALUES (
    '32e9c839-f67c-40f6-9291-723fb5da15cd', 
    'sushilpatel7489@gmail.com',
    'Sushil Patel', -- Default name, user can update later
    'admin',
    true
)
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', is_verified = true;

-- 2. Insert into admin_users table
INSERT INTO public.admin_users (user_id) 
VALUES ('32e9c839-f67c-40f6-9291-723fb5da15cd')
ON CONFLICT (user_id) DO NOTHING;

-- Verification
SELECT * FROM public.users WHERE id = '32e9c839-f67c-40f6-9291-723fb5da15cd';
