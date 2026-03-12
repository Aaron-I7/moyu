-- Create analytics_events table
create table if not exists public.analytics_events (
  id uuid default gen_random_uuid() primary key,
  event_name text not null,
  properties jsonb default '{}'::jsonb,
  url text,
  user_id uuid references auth.users(id) on delete set null,
  session_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.analytics_events enable row level security;

-- Create policy to allow anyone (anon) to insert events
create policy "Allow anonymous insert" on public.analytics_events
  for insert with check (true);

-- Create policy to allow users to view their own events (optional, maybe admin only)
-- For now, we only care about inserting data.
