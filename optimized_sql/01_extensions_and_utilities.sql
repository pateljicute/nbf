-- 01_extensions_and_utilities.sql
-- PURPOSE: Setup extensions and shared helper functions.
-- ORDER: 1/12

-- 1. Enable Extensions
-- 'uuid-ossp' is required for UUID generation.
-- 'postgis' is required for geospatial queries (nearby properties).
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Global Helper Functions

-- Function: slugify
-- Purpose: Converts text into a URL-friendly slug.
-- Example: "Two Bedroom Flat" -> "two-bedroom-flat"
CREATE OR REPLACE FUNCTION public.slugify(value TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(value, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: is_admin
-- Purpose: Securely checks if the current user is an admin.
-- NOTE: Uses SECURITY DEFINER to bypass RLS recursion when policies call this function.
-- This allows checking the admin table/role without triggering infinite loops in 'users' policies.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user exists in validation table OR has role 'admin' in users table
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
