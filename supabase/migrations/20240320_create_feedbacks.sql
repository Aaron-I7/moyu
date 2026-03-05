-- Create feedbacks table
create table if not exists public.feedbacks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  content text not null,
  contact text, -- Optional email or contact info
  status text default 'pending' check (status in ('pending', 'read', 'archived')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS (Row Level Security)
alter table public.feedbacks enable row level security;

-- Policy: Anyone can insert feedback (even anonymous users, though user_id will be null)
create policy "Anyone can insert feedback"
  on public.feedbacks for insert
  with check (true);

-- Policy: Only authenticated users can view their own feedback (optional, depending on requirements)
create policy "Users can view own feedback"
  on public.feedbacks for select
  using (auth.uid() = user_id);

-- Policy: Only admins/service role can update/delete (for now, just rely on service role or future admin role)
-- We don't add specific admin policies here unless we have an admin role system ready.
