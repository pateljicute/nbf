-- URGEENT DEBUGGING: TEMPORARILY DISABLE RLS
-- This is to verify if RLS is blocking the tracking inserts.

-- 1. Disable RLS on leads_activity
ALTER TABLE leads_activity DISABLE ROW LEVEL SECURITY;

-- 2. Disable RLS on property_views
ALTER TABLE property_views DISABLE ROW LEVEL SECURITY;

-- 3. (Optional) Alternatively, keep RLS enabled but add a "Permissive" policy
-- In case disabling RLS completely causes other issues with Supabase client (unlikely but possible)
-- We'll just stick to disabling it for now as it's the most surefire way to rule out RLS.

-- NOTE: To re-enable later, run:
-- ALTER TABLE leads_activity ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;
