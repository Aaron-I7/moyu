-- 1. Create profiles table
create table if not exists public.profiles (
  id uuid not null references auth.users on delete cascade primary key,
  nickname text not null unique,
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Create user_game_data table
create table if not exists public.user_game_data (
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_key text not null,
  data jsonb not null default '{}'::jsonb,
  synced_at timestamptz default now(),
  primary key (user_id, module_key)
);

-- 3. Enable RLS
alter table public.profiles enable row level security;
alter table public.user_game_data enable row level security;

-- 4. RLS Policies

-- Profiles: Users can view their own profile
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- Profiles: Users can update their own profile
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Profiles: Users can insert their own profile (during registration)
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- User Game Data: Users can perform all operations on their own game data
drop policy if exists "Users can all operations own game data" on public.user_game_data;
create policy "Users can all operations own game data" on public.user_game_data
  for all using (auth.uid() = user_id);
