-- 1. Create Inquiries Table (if not exists)
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    subject TEXT,
    message TEXT,
    phone_number TEXT,
    property_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'unread' -- 'unread', 'read', 'replied'
);

-- 2. Add columns if missing (idempotent)
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'inquiries' and column_name = 'first_name') then
        alter table public.inquiries add column first_name text;
    end if;
     if not exists (select 1 from information_schema.columns where table_name = 'inquiries' and column_name = 'last_name') then
        alter table public.inquiries add column last_name text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'inquiries' and column_name = 'phone_number') then
        alter table public.inquiries add column phone_number text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'inquiries' and column_name = 'property_id') then
        alter table public.inquiries add column property_id text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'inquiries' and column_name = 'message') then
        alter table public.inquiries add column message text;
    end if;
     if not exists (select 1 from information_schema.columns where table_name = 'inquiries' and column_name = 'email') then
        alter table public.inquiries add column email text;
    end if;
end $$;

-- 3. Enable RLS
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- 4. Policies using is_admin() to prevent recursion
-- Insert: Anyone can insert (contact form)
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.inquiries;
CREATE POLICY "Enable insert for everyone" ON public.inquiries FOR INSERT WITH CHECK (true);

-- Select: Only Admins can view
DROP POLICY IF EXISTS "Admins can view inquiries" ON public.inquiries;
CREATE POLICY "Admins can view inquiries" ON public.inquiries FOR SELECT USING (
    is_admin()
);

-- Update: Only Admins can update (e.g., mark as read)
DROP POLICY IF EXISTS "Admins can update inquiries" ON public.inquiries;
CREATE POLICY "Admins can update inquiries" ON public.inquiries FOR UPDATE USING (
    is_admin()
);

-- Delete: Only Admins can delete
DROP POLICY IF EXISTS "Admins can delete inquiries" ON public.inquiries;
CREATE POLICY "Admins can delete inquiries" ON public.inquiries FOR DELETE USING (
    is_admin()
);

-- 5. Grant access
GRANT ALL ON public.inquiries TO postgres;
GRANT ALL ON public.inquiries TO anon;
GRANT ALL ON public.inquiries TO authenticated;
GRANT ALL ON public.inquiries TO service_role;
