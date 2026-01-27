-- FINAL FIX TRACKING SCRIPT
-- RUN THIS SCRIPT to permanently fix "0 Data" issues and Sync problems.

-- 1. Ensure Tables Exist
CREATE TABLE IF NOT EXISTS public.leads_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID, -- Can reference properties(id) strictly or loosely
    owner_id UUID,
    action_type TEXT NOT NULL, -- 'whatsapp', 'contact'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.5 ENSURE COLUMNS EXIST (Fix for 'owner_id does not exist' error)
ALTER TABLE public.leads_activity ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE public.leads_activity ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';

CREATE TABLE IF NOT EXISTS public.property_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ENABLE RLS (Security)
ALTER TABLE public.leads_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;

-- 3. RESET POLICIES (Drop Old, Create New)
-- Leads Activity
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.leads_activity;
DROP POLICY IF EXISTS "Admins and Owners View Leads" ON public.leads_activity;
DROP POLICY IF EXISTS "Users can view own leads" ON public.leads_activity;
DROP POLICY IF EXISTS "Admins and Users View Leads" ON public.leads_activity; -- Added drop for new name

CREATE POLICY "Enable insert for authenticated users only"
ON public.leads_activity FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins and Users View Leads"
ON public.leads_activity FOR SELECT TO authenticated
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' 
  OR 
  auth.uid() = user_id
  OR
  auth.uid() = owner_id
);

-- Property Views
DROP POLICY IF EXISTS "Enable insert for property views" ON public.property_views;
DROP POLICY IF EXISTS "Admins and Owners View Views" ON public.property_views;
DROP POLICY IF EXISTS "Admins and Users View Views" ON public.property_views; -- Added drop for new name

CREATE POLICY "Enable insert for property views"
ON public.property_views FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins and Users View Views"
ON public.property_views FOR SELECT TO authenticated
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' 
  OR 
  auth.uid() = user_id
);

-- 4. SYNC TRIGGER (Ensure Properties Table Leads Count Matches)
-- Drop existing trigger if any to avoid duplication errors
DROP TRIGGER IF EXISTS on_lead_added ON public.leads_activity;
DROP FUNCTION IF EXISTS increment_property_leads_count();

-- Create Function
CREATE OR REPLACE FUNCTION increment_property_leads_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the leads_count in properties table
  -- Assuming 'properties' table has 'leads_count' (int) and 'id' (uuid)
  UPDATE public.properties
  SET leads_count = COALESCE(leads_count, 0) + 1
  WHERE id = NEW.property_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger
CREATE TRIGGER on_lead_added
AFTER INSERT ON public.leads_activity
FOR EACH ROW
EXECUTE FUNCTION increment_property_leads_count();

-- 5. VERIFICATION
-- Check if table exists properly
SELECT count(*) as total_leads FROM public.leads_activity;

-- 6. FIX USERS TABLE VISIBILITY (Prevent Recursion)
-- Create a secure function to check admin status without hitting RLS loops
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update Users Policy
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.users; -- Optional if you have this

-- Allow users to see their own profile
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT TO authenticated
USING (
  auth.uid() = id
  OR
  public.is_admin()
);

-- Update Leads/Views Policies to use the safe function (Refining Step 3)
DROP POLICY IF EXISTS "Admins and Users View Leads" ON public.leads_activity;
CREATE POLICY "Admins and Users View Leads"
ON public.leads_activity FOR SELECT TO authenticated
USING (
  public.is_admin() 
  OR 
  auth.uid() = user_id
  OR
  auth.uid() = owner_id
);

DROP POLICY IF EXISTS "Admins and Users View Views" ON public.property_views;
CREATE POLICY "Admins and Users View Views"
ON public.property_views FOR SELECT TO authenticated
USING (
  public.is_admin() 
  OR 
  auth.uid() = user_id
);
