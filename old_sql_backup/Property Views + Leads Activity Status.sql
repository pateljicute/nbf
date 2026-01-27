-- 1. Create leads_activity table (if not exists)
create table if not exists public.leads_activity (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  property_id text not null, 
  property_owner_id uuid references auth.users,
  action_type text not null check (action_type in ('whatsapp', 'contact', 'call'))
);

-- 2. Create property_views table (if not exists)
create table if not exists public.property_views (
    id uuid not null default gen_random_uuid(),
    created_at timestamp with time zone not null default now(),
    property_id text not null,
    user_id uuid references auth.users(id) on delete cascade,
    primary key (id)
);

-- Helper function to check admin status without recursion
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
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

-- 3. Add status to leads_activity
-- We use a block to safely add column if it doesn't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'leads_activity' and column_name = 'status') then
        alter table public.leads_activity add column status text default 'new';
        alter table public.leads_activity add constraint leads_activity_status_check check (status in ('new', 'contacted', 'interested', 'closed'));
    end if;
end $$;

-- 4. Enable RLS
alter table public.leads_activity enable row level security;
alter table public.property_views enable row level security;

-- 5. Policies for leads_activity
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

-- 6. Policies for property_views
drop policy if exists "Enable insert for authenticated users" on public.property_views;
create policy "Enable insert for authenticated users" on public.property_views for insert to authenticated with check (true);

drop policy if exists "Enable select for admin only" on public.property_views;
create policy "Enable select for admin only" on public.property_views for select to authenticated using (
    auth.uid() = user_id 
    OR 
    is_admin()
);

-- 7. Policy for viewing users (Admins need to see everyone)
drop policy if exists "Admins can view all users" on public.users;
create policy "Admins can view all users" on public.users for select using (
    auth.uid() = id
    OR
    is_admin()
);
