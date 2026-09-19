drop policy if exists "jobs_owner_insert" on public.jobs;
create policy "jobs_owner_insert" on public.jobs for insert with check (auth.uid() = user_id);
drop policy if exists "jobs_owner_update" on public.jobs;
create policy "jobs_owner_update" on public.jobs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
