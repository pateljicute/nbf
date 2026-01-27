-- Create profiles table if it doesn't exist (Optional, as code uses public.users)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  is_banned boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Grant access to authenticated users
grant all on table public.profiles to authenticated;
grant all on table public.profiles to service_role;
