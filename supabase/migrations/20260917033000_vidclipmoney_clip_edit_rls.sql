drop policy if exists "clips_update_own" on public.clips;
create policy "clips_update_own" on public.clips for update using (user_id = auth.uid()) with check (user_id = auth.uid());
