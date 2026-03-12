-- Allow reading analytics data (public dashboard)
create policy "Allow public read" on public.analytics_events
  for select using (true);
