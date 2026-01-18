-- Create leads_activity table
create table if not exists public.leads_activity (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  property_id text not null, -- references properties(id) - text based id
  property_owner_id uuid references auth.users,
  action_type text not null check (action_type in ('whatsapp', 'contact', 'call'))
);

-- RLS Policies
alter table public.leads_activity enable row level security;

-- Allow authenticated users to insert their own activity
create policy "Users can insert their own activity"
  on public.leads_activity for insert
  with check (auth.uid() = user_id);

-- Allow admins to view all activity (assuming admin check logic exists or just allow authenticated for now/admins only)
-- Ideally: 
create policy "Admins can view all activity"
  on public.leads_activity for select
  using (
    exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'admin'
    )
    or
    auth.uid() = property_owner_id -- Owners can see leads for their properties
  );

-- Allow admins to delete
create policy "Admins can delete activity"
  on public.leads_activity for delete
  using (
    exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'admin'
    )
  );
