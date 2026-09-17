-- VidClipMoney worker runtime: atomic claim, lease ownership, and stage transitions.
-- Additive and compatible with the existing jobs.status + jobs.engine_status model.

create extension if not exists pgcrypto;

alter table public.jobs
  add column if not exists lease_id uuid,
  add column if not exists leased_until timestamptz;

alter table public.jobs
  alter column attempts set default 0;

update public.jobs
set attempts = 0
where attempts is null;

alter table public.jobs
  alter column attempts set not null;

create index if not exists jobs_worker_claim_idx
  on public.jobs (status, leased_until, created_at)
  where status = 'queued';

create index if not exists jobs_worker_lease_idx
  on public.jobs (lease_id)
  where lease_id is not null;

create or replace function public.claim_content_engine_job(p_lease_ms integer default 300000)
returns setof public.jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.jobs;
  v_lease uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception 'WORKER_SERVICE_ROLE_REQUIRED';
  end if;

  if p_lease_ms <= 0 or p_lease_ms > 3600000 then
    raise exception 'WORKER_LEASE_INVALID';
  end if;

  v_lease := gen_random_uuid();

  select j.*
    into v_job
  from public.jobs j
  where j.status = 'queued'
    and (j.leased_until is null or j.leased_until <= now())
  order by j.created_at asc
  for update skip locked
  limit 1;

  if not found then
    return;
  end if;

  update public.jobs
  set lease_id = v_lease,
      leased_until = now() + make_interval(secs => p_lease_ms::double precision / 1000),
      attempts = attempts + 1,
      status = 'processing',
      updated_at = now()
  where id = v_job.id;

  return query
  select j.* from public.jobs j where j.id = v_job.id;
end;
$$;

create or replace function public.update_content_engine_stage(
  p_job_id uuid,
  p_from text,
  p_to text,
  p_lease_id uuid
)
returns public.jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.jobs;
begin
  if auth.role() <> 'service_role' then
    raise exception 'WORKER_SERVICE_ROLE_REQUIRED';
  end if;

  if p_to not in ('DOWNLOADING','TRANSCRIBING','ANALYZING','SELECTING','GENERATING','RENDERING','COMPLETED') then
    raise exception 'INVALID_ENGINE_STAGE';
  end if;

  update public.jobs
  set engine_status = p_to,
      status = case when p_to = 'COMPLETED' then 'completed' else 'processing' end,
      updated_at = now(),
      lease_id = case when p_to = 'COMPLETED' then null else lease_id end,
      leased_until = case when p_to = 'COMPLETED' then null else leased_until end
  where id = p_job_id
    and lease_id = p_lease_id
    and leased_until > now()
    and engine_status = p_from
  returning * into v_job;

  if not found then
    raise exception 'WORKER_STAGE_OWNERSHIP_OR_STATE_MISMATCH';
  end if;

  return v_job;
end;
$$;

create or replace function public.fail_content_engine_job(
  p_job_id uuid,
  p_lease_id uuid,
  p_error jsonb default '{}'::jsonb
)
returns public.jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.jobs;
begin
  if auth.role() <> 'service_role' then
    raise exception 'WORKER_SERVICE_ROLE_REQUIRED';
  end if;

  update public.jobs
  set engine_status = 'FAILED',
      status = 'failed',
      error_details = coalesce(p_error, '{}'::jsonb),
      updated_at = now(),
      lease_id = null,
      leased_until = null
  where id = p_job_id
    and lease_id = p_lease_id
    and leased_until > now()
  returning * into v_job;

  if not found then
    raise exception 'WORKER_FAILURE_OWNERSHIP_MISMATCH';
  end if;

  return v_job;
end;
$$;

revoke all on function public.claim_content_engine_job(integer) from public;
revoke all on function public.update_content_engine_stage(uuid,text,text,uuid) from public;
revoke all on function public.fail_content_engine_job(uuid,uuid,jsonb) from public;
grant execute on function public.claim_content_engine_job(integer) to service_role;
grant execute on function public.update_content_engine_stage(uuid,text,text,uuid) to service_role;
grant execute on function public.fail_content_engine_job(uuid,uuid,jsonb) to service_role;
