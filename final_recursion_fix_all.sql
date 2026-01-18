-- MASTER FIX SCRIPT FOR INFINITE RECURSION
-- Run this script ONCE to fix 'users' table recursion and all tracking permissions.

-- 1. Create the HELPER FUNCTION (Crucial for stopping recursion)
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
as $$
begin
  -- This function checks admin status securely without triggering the loop
  return exists (
    select 1
    from public.users
    where id = auth.uid()
    and role = 'admin'
  );
end;
$$;

-- 2. FIX 'public.users' POLICY (The source of the error)
alter table public.users enable row level security;

drop policy if exists "Admins can view all users" on public.users;
drop policy if exists "Users can view their own profile" on public.users;
drop policy if exists "Users can update their own profile" on public.users;

-- Safe Policy: Users see themselves OR Admins see everyone (using function)
create policy "Users and Admins view profiles" on public.users for select using (
    auth.uid() = id
    OR
    is_admin()
);

-- Safe Policy: Users update themselves
create policy "Users can update own profile" on public.users for update using (
    auth.uid() = id
);

-- 3. FIX 'leads_activity' POLICIES
create table if not exists public.leads_activity (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  property_id text not null, 
  property_owner_id uuid references auth.users,
  action_type text not null,
  status text default 'new'
);
alter table public.leads_activity enable row level security;

drop policy if exists "Users can insert their own lead activity" on public.leads_activity;
create policy "Users can insert their own lead activity" on public.leads_activity for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Admins and Owners can view lead activity" on public.leads_activity;
create policy "Admins and Owners can view lead activity" on public.leads_activity for select using (
    is_admin()
    or
    auth.uid() = property_owner_id
    or
    auth.uid() = user_id
);

drop policy if exists "Admins can delete lead activity" on public.leads_activity;
create policy "Admins can delete lead activity" on public.leads_activity for delete using (
    is_admin()
);

drop policy if exists "Admins can update lead status" on public.leads_activity;
create policy "Admins can update lead status" on public.leads_activity for update using (
    is_admin()
);

-- 4. FIX 'inquiries' POLICIES
create table if not exists public.inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    subject TEXT,
    message TEXT,
    phone_number TEXT,
    property_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'unread'
);
alter table public.inquiries enable row level security;

DROP POLICY IF EXISTS "Enable insert for everyone" ON public.inquiries;
CREATE POLICY "Enable insert for everyone" ON public.inquiries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view inquiries" ON public.inquiries;
CREATE POLICY "Admins can view inquiries" ON public.inquiries FOR SELECT USING (
    is_admin()
);

DROP POLICY IF EXISTS "Admins can update inquiries" ON public.inquiries;
CREATE POLICY "Admins can update inquiries" ON public.inquiries FOR UPDATE USING (
    is_admin()
);

DROP POLICY IF EXISTS "Admins can delete inquiries" ON public.inquiries;
CREATE POLICY "Admins can delete inquiries" ON public.inquiries FOR DELETE USING (
    is_admin()
);

-- 5. FIX 'property_views' POLICIES
create table if not exists public.property_views (
    id uuid not null default gen_random_uuid(),
    created_at timestamp with time zone not null default now(),
    property_id text not null,
    user_id uuid references auth.users(id) on delete cascade,
    primary key (id)
);
alter table public.property_views enable row level security;

drop policy if exists "Enable insert for authenticated users" on public.property_views;
create policy "Enable insert for authenticated users" on public.property_views for insert to authenticated with check (true);

drop policy if exists "Enable select for admin only" on public.property_views;
create policy "Enable select for admin only" on public.property_views for select to authenticated using (
    auth.uid() = user_id 
    OR 
    is_admin()
);
