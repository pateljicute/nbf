-- FIX TRACKING PERMISSIONS
-- Run this to fix "0 Leads" or "No Activity" issues.

-- 1. LEADS ACTIVITY
ALTER TABLE public.leads_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.leads_activity;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON public.leads_activity;
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads_activity;

-- Allow anyone logged in to create a lead
CREATE POLICY "Enable insert for authenticated users only"
ON public.leads_activity
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow Admins to see ALL leads, and Users to see THEIR OWN leads
CREATE POLICY "Admins and Owners View Leads"
ON public.leads_activity
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' 
  OR 
  auth.uid() = user_id
);

-- 2. PROPERTY VIEWS
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.property_views;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON public.property_views;

CREATE POLICY "Enable insert for property views"
ON public.property_views
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins and Owners View Views"
ON public.property_views
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' 
  OR 
  auth.uid() = user_id
);

-- 3. VERIFY DATA (Optional Debug)
-- This will return the count of leads in the system to verify data exists
SELECT count(*) as total_leads_in_system FROM public.leads_activity;
