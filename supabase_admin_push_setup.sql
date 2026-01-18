
-- Create a private table for admin settings (e.g., push subscriptions)
create table if not exists public.admin_settings (
  user_id uuid references auth.users not null primary key,
  push_subscription jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.admin_settings enable row level security;

-- Policy: Only the specific admin user can view/update their own settings
-- (Assuming we restrict access further by logic or additional policies, but this is a good start)
create policy "Users can view own admin settings"
  on public.admin_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own admin settings"
  on public.admin_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own admin settings"
  on public.admin_settings for update
  using (auth.uid() = user_id);
