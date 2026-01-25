-- 1. PROPERTIES: Prevent Banned Users from Inserting
DROP POLICY IF EXISTS "Banned users cannot insert properties" ON public.properties;

CREATE POLICY "Banned users cannot insert properties"
ON public.properties
FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_banned = true
  )
);

-- 2. LEADS: Prevent Banned Users from Inserting Leads
DROP POLICY IF EXISTS "Banned users cannot insert leads" ON public.leads_activity;

CREATE POLICY "Banned users cannot insert leads"
ON public.leads_activity
FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_banned = true
  )
);

-- 3. INQUIRIES: Prevent Banned Users from Contacting
DROP POLICY IF EXISTS "Banned users cannot insert inquiries" ON public.inquiries;

CREATE POLICY "Banned users cannot insert inquiries"
ON public.inquiries
FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_banned = true
  )
);
