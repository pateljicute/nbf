-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create Users Table (Public Profile)
create table public.users (
  id uuid references auth.users not null primary key,
  full_name text,
  email text,
  contact_number text,
  avatar_url text,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for users
alter table public.users enable row level security;

-- Policies for users
create policy "Public profiles are viewable by everyone."
  on public.users for select
  using ( true );

create policy "Users can insert their own profile."
  on public.users for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.users for update
  using ( auth.uid() = id );

-- 2. Create Properties Table
create table public.properties (
  id uuid default uuid_generate_v4() primary key,
  handle text unique not null,
  title text not null,
  description text,
  description_html text,
  price_range jsonb,
  currency_code text default 'INR',
  featured_image jsonb,
  images jsonb[],
  tags text[],
  options jsonb[],
  variants jsonb[],
  seo jsonb,
  available_for_sale boolean default false,
  category_id text,
  contact_number text,
  user_id uuid references public.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for properties
alter table public.properties enable row level security;

-- Policies for properties
create policy "Properties are viewable by everyone."
  on public.properties for select
  using ( true );

create policy "Users can insert their own properties."
  on public.properties for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own properties."
  on public.properties for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own properties."
  on public.properties for delete
  using ( auth.uid() = user_id );

-- 3. Create Collections Table (Categories)
create table public.collections (
  id text primary key,
  handle text unique not null,
  title text not null,
  description text,
  path text,
  seo jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for collections
alter table public.collections enable row level security;

-- Policies for collections
create policy "Collections are viewable by everyone."
  on public.collections for select
  using ( true );

-- 4. Create Admin Users Table
create table public.admin_users (
  user_id uuid references public.users(id) primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for admin_users
alter table public.admin_users enable row level security;

-- Policies for admin_users
create policy "Admins are viewable by everyone."
  on public.admin_users for select
  using ( true );

-- 5. Trigger to handle new user signup
-- This automatically creates a public user profile when a user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Insert Default Collections (Optional)
insert into public.collections (id, handle, title, description, path) values
('joyco-root', 'all', 'All Properties', 'Browse all properties', '/shop'),
('apartments', 'apartments', 'Apartments', 'Find the best apartments', '/search/apartments'),
('pg', 'pg', 'PG / Hostels', 'Affordable PGs and Hostels', '/search/pg'),
('rooms', 'rooms', 'Private Rooms', 'Cozy private rooms', '/search/rooms');
