-- VidClipMoney Worker Runtime
-- Atomic claim/lease boundary for the asynchronous content engine.

create extension if not exists pgcrypto;

alter table public.jobs
  add column if not exists lease_id uuid,
  add column if not exists leased_until timestamptz;

alter table public.jobs
  alter column attempts set default 0;

create index if not exists jobs_worker_claim_idx
  on public.jobs (status, leased_until, created_at)
  where status = 'queued';

create unique index if not exists jobs_active_lease_idx
  on public.jobs (lease_id)
  where lease_id is not null;

create or replace function public.claim_content_engine_job(
  p_lease_ms integer default 300000
)
returns table (
  id uuid,
  project_id uuid,
  user_id uuid,
  mode text,
  engine_status text,
  lease_id uuid,
  leased_until timestamptz,
  attempts integer,
  input_path text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'WORKER_SERVICE_ROLE_REQUIRED';
  end if;

  if p_lease_ms <= 0 or p_lease_ms > 3600000 then
    raise exception 'WORKER_LEASE_INVALID';
  end if;

  return query
  with candidate as (
    select j.id
    from public.jobs j
    where j.status = 'queued'
      and (j.lease_id is null or j.leased_until <= now())
      and j.engine_status not in ('COMPLETED', 'FAILED')
    order by j.created_at asc
    for update skip locked
    limit 1
  )
  update public.jobs j
     set lease_id = gen_random_uuid(),
         leased_until = now() + (p_lease_ms::text || ' milliseconds')::interval,
         attempts = coalesce(j.attempts, 0) + 1
    from candidate c
   where j.id = c.id
  returning
    j.id,
    j.project_id,
    j.user_id,
    j.mode,
    j.engine_status,
    j.lease_id,
    j.leased_until,
    j.attempts,
    j.input_path;
end;
$$;

revoke all on function public.claim_content_engine_job(integer) from public;
revoke all on function public.claim_content_engine_job(integer) from anon;
revoke all on function public.claim_content_engine_job(integer) from authenticated;
grant execute on function public.claim_content_engine_job(integer) to service_role;
