-- NUCLEAR OPTION: CLEAN SLATE FIX
-- This script WIPES all policies to ensure no hidden recursion rules remain.

-- 1. DROP ALL POLICIES on users table
do $$
declare
  r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'users' loop
    execute 'drop policy "' || r.policyname || '" on public.users';
  end loop;
end $$;

-- 2. DROP ALL POLICIES on tracking tables
do $$
declare
  r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'leads_activity' loop
    execute 'drop policy "' || r.policyname || '" on public.leads_activity';
  end loop;
end $$;

do $$
declare
  r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'inquiries' loop
    execute 'drop policy "' || r.policyname || '" on public.inquiries';
  end loop;
end $$;

do $$
declare
  r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'property_views' loop
    execute 'drop policy "' || r.policyname || '" on public.property_views';
  end loop;
end $$;

-- 3. RECREATE SAFE ADMIN FUNCTION
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.users
    where id = auth.uid()
    and role = 'admin'
  );
end;
$$;

-- 4. APPLY FRESH POLICIES

-- Users Table
alter table public.users enable row level security;
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Admins can view all profiles" on public.users for select using (is_admin());
-- Note: Insert is handled by Supabase Auth usually, or public triggers. We won't block it if policies don't cover it (default deny). 
-- But typically public.users is managed by trigger.

-- Leads Activity
alter table public.leads_activity enable row level security;
create policy "Users insert own leads" on public.leads_activity for insert to authenticated with check (auth.uid() = user_id);
create policy "Admins/Owners view leads" on public.leads_activity for select using (is_admin() or auth.uid() = property_owner_id or auth.uid() = user_id);
create policy "Admins manage leads" on public.leads_activity for all using (is_admin());

-- Property Views
alter table public.property_views enable row level security;
create policy "Users insert views" on public.property_views for insert to authenticated with check (true);
create policy "Admins/Self view views" on public.property_views for select using (is_admin() or auth.uid() = user_id);

-- Inquiries
alter table public.inquiries enable row level security;
create policy "Public insert inquiries" on public.inquiries for insert with check (true);
create policy "Admins view inquiries" on public.inquiries for select using (is_admin());
create policy "Admins manage inquiries" on public.inquiries for all using (is_admin());
