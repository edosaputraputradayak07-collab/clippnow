-- Harden worker recovery semantics: stale processing leases must be reclaimable,
-- stage progress must be persisted, and failure must be handled by the failure RPC.

alter table public.jobs
  add column if not exists progress numeric not null default 0;

alter table public.jobs
  add constraint jobs_progress_range_chk check (progress >= 0 and progress <= 100);

create index if not exists jobs_worker_claim_recovery_idx
  on public.jobs(status, leased_until, created_at)
  where status in ('queued','processing');

create or replace function public.claim_content_engine_job(p_lease_ms integer default 300000)
returns table(
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
set search_path=public
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
    where j.status in ('queued','processing')
      and (j.lease_id is null or j.leased_until <= now())
      and j.engine_status not in ('COMPLETED','FAILED')
    order by j.created_at asc
    for update skip locked
    limit 1
  )
  update public.jobs j
  set lease_id=gen_random_uuid(),
      leased_until=now() + (p_lease_ms::text || ' milliseconds')::interval,
      attempts=coalesce(j.attempts,0)+1,
      status='processing'
  from candidate c
  where j.id=c.id
  returning j.id,j.project_id,j.user_id,j.mode,j.engine_status,j.lease_id,
            j.leased_until,j.attempts,j.input_path;
end;
$$;

create or replace function public.update_content_engine_stage(
  p_job_id uuid,
  p_from_status text,
  p_to_status text,
  p_lease_id uuid,
  p_progress numeric
)
returns table(updated boolean)
language plpgsql
security definer
set search_path=public
as $$
declare
  v_allowed boolean;
begin
  if auth.role() <> 'service_role' then
    raise exception 'WORKER_SERVICE_ROLE_REQUIRED';
  end if;

  if p_progress < 0 or p_progress > 100 then
    raise exception 'WORKER_PROGRESS_INVALID';
  end if;

  if p_to_status = 'FAILED' then
    raise exception 'USE_FAIL_CONTENT_ENGINE_JOB';
  end if;

  v_allowed := case p_from_status
    when 'QUEUED' then p_to_status = 'DOWNLOADING'
    when 'DOWNLOADING' then p_to_status = 'TRANSCRIBING'
    when 'TRANSCRIBING' then p_to_status = 'ANALYZING'
    when 'ANALYZING' then p_to_status = 'SELECTING'
    when 'SELECTING' then p_to_status = 'GENERATING'
    when 'GENERATING' then p_to_status = 'RENDERING'
    when 'RENDERING' then p_to_status = 'COMPLETED'
    else false
  end;

  if not v_allowed then
    raise exception 'INVALID_JOB_TRANSITION:%->%',p_from_status,p_to_status;
  end if;

  return query
  update public.jobs j
  set engine_status=p_to_status,
      progress=p_progress,
      status=case when p_to_status='COMPLETED' then 'completed' else 'processing' end,
      lease_id=case when p_to_status='COMPLETED' then null else j.lease_id end,
      leased_until=case when p_to_status='COMPLETED' then null else j.leased_until end
  where j.id=p_job_id
    and j.lease_id=p_lease_id
    and j.engine_status=p_from_status
    and j.leased_until > now()
  returning true;
end;
$$;

create or replace function public.fail_content_engine_job(
  p_job_id uuid,
  p_lease_id uuid,
  p_error jsonb
)
returns table(updated boolean)
language plpgsql
security definer
set search_path=public
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'WORKER_SERVICE_ROLE_REQUIRED';
  end if;

  return query
  update public.jobs j
  set engine_status='FAILED',
      status='failed',
      progress=100,
      error_details=p_error,
      lease_id=null,
      leased_until=null
  where j.id=p_job_id
    and j.lease_id=p_lease_id
    and j.engine_status <> 'COMPLETED'
  returning true;
end;
$$;

revoke all on function public.claim_content_engine_job(integer) from public, anon, authenticated;
grant execute on function public.claim_content_engine_job(integer) to service_role;

revoke all on function public.update_content_engine_stage(uuid,text,text,uuid,numeric) from public, anon, authenticated;
grant execute on function public.update_content_engine_stage(uuid,text,text,uuid,numeric) to service_role;

revoke all on function public.fail_content_engine_job(uuid,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.fail_content_engine_job(uuid,uuid,jsonb) to service_role;
