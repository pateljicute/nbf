-- Database Reset Script
-- WARNING: This will DELETE ALL DATA in your database.
-- Run this ONLY if you want to start fresh with the Master Setup Script.

DROP TABLE IF EXISTS public.properties_leads CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.properties CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.collections CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Optional: Drop Types if any (custom types not standardly used but good practice to check)
-- DROP TYPE IF EXISTS public.some_custom_type;
