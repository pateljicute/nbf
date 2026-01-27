-- 08_rls_properties.sql
-- PURPOSE: Secure content tables (Properties, Collections, etc).
-- ORDER: 8/12

-- 1. Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 2. Properties Policies
-- SELECT: Everyone can view.
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON public.properties;
CREATE POLICY "Properties are viewable by everyone" ON public.properties FOR SELECT USING (true);

-- INSERT: Authenticated users can create.
DROP POLICY IF EXISTS "Users can insert own properties" ON public.properties;
CREATE POLICY "Users can insert own properties" ON public.properties FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Owner only OR Admin.
DROP POLICY IF EXISTS "Owners and Admins can update properties" ON public.properties;
CREATE POLICY "Owners and Admins can update properties" ON public.properties FOR UPDATE USING (
  auth.uid() = user_id OR public.is_admin()
);

-- DELETE: Owner only OR Admin.
DROP POLICY IF EXISTS "Owners and Admins can delete properties" ON public.properties;
CREATE POLICY "Owners and Admins can delete properties" ON public.properties FOR DELETE USING (
  auth.uid() = user_id OR public.is_admin()
);

-- 3. Collections & Ads & Settings Policies
-- SELECT: Everyone can view.
DROP POLICY IF EXISTS "Collections viewable by everyone" ON public.collections;
CREATE POLICY "Collections viewable by everyone" ON public.collections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Ads viewable by everyone" ON public.ads;
CREATE POLICY "Ads viewable by everyone" ON public.ads FOR SELECT USING (true);

DROP POLICY IF EXISTS "Settings viewable by everyone" ON public.site_settings;
CREATE POLICY "Settings viewable by everyone" ON public.site_settings FOR SELECT USING (true);

-- WRITE (Update/Insert/Delete): Admins ONLY.
DROP POLICY IF EXISTS "Admins manage collections" ON public.collections;
CREATE POLICY "Admins manage collections" ON public.collections FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage ads" ON public.ads;
CREATE POLICY "Admins manage ads" ON public.ads FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage settings" ON public.site_settings;
CREATE POLICY "Admins manage settings" ON public.site_settings FOR ALL USING (public.is_admin());
