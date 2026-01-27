-- 09_rls_interactions.sql
-- PURPOSE: Secure high-volume tracking tables.
-- ORDER: 9/12

-- 1. Enable RLS
ALTER TABLE public.leads_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- 2. Leads Activity Policies
-- INSERT: Authenticated users can insert.
DROP POLICY IF EXISTS "Authenticated can insert leads" ON public.leads_activity;
CREATE POLICY "Authenticated can insert leads" ON public.leads_activity FOR INSERT TO authenticated WITH CHECK (true);

-- SELECT: Admins OR the Owner of the property.
-- Note: 'owner_id' column in leads_activity allows this check WITHOUT joining properties table.
DROP POLICY IF EXISTS "Admins and Owners view leads" ON public.leads_activity;
CREATE POLICY "Admins and Owners view leads" ON public.leads_activity FOR SELECT USING (
  auth.uid() = owner_id OR public.is_admin()
);

-- 3. Property Views Policies
-- INSERT: Authenticated users can insert.
DROP POLICY IF EXISTS "Authenticated can insert views" ON public.property_views;
CREATE POLICY "Authenticated can insert views" ON public.property_views FOR INSERT TO authenticated WITH CHECK (true);

-- SELECT: Admins OR Owner (if we had owner_id here, but we don't usually need to query views individually).
-- We'll allow Admins to view all.
DROP POLICY IF EXISTS "Admins view all views" ON public.property_views;
CREATE POLICY "Admins view all views" ON public.property_views FOR SELECT USING (public.is_admin());

-- 4. Inquiries Policies
-- INSERT: Public (anon) or Authenticated.
DROP POLICY IF EXISTS "Everyone can insert inquiries" ON public.inquiries;
CREATE POLICY "Everyone can insert inquiries" ON public.inquiries FOR INSERT WITH CHECK (true);

-- SELECT: Admins ONLY.
DROP POLICY IF EXISTS "Admins view inquiries" ON public.inquiries;
CREATE POLICY "Admins view inquiries" ON public.inquiries FOR SELECT USING (public.is_admin());
