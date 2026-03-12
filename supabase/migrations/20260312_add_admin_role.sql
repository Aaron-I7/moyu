-- Add role column to profiles
alter table public.profiles add column if not exists role text default 'user';

-- Create a function to handle new user registration and assign admin role to specific email
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nickname, role)
  values (
    new.id,
    split_part(new.email, '@', 1), -- default nickname from email
    case when new.email = 'admin@moyu.com' then 'admin' else 'user' end
  )
  on conflict (id) do update set
    role = excluded.role; -- Ensure role is updated if profile exists
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create profile for new users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update analytics_events RLS to restrict access to admins only
-- First, drop the public read policy
drop policy if exists "Allow public read" on public.analytics_events;

-- Create policy for admins
create policy "Allow admins to read analytics" on public.analytics_events
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Allow admins to delete analytics events (optional, for cleanup)
create policy "Allow admins to delete analytics" on public.analytics_events
  for delete using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Update existing user if exists
update public.profiles
set role = 'admin'
where id in (select id from auth.users where email = 'admin@moyu.com');
