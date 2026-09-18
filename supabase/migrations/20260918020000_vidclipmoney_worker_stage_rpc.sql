create or replace function public.update_content_engine_stage(
  p_job_id uuid,
  p_from_status text,
  p_to_status text,
  p_lease_id uuid,
  p_progress numeric
)
returns table (updated boolean)
language plpgsql
security definer
set search_path = public
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

  v_allowed := case p_from_status
    when 'QUEUED' then p_to_status in ('DOWNLOADING','TRANSCRIBING','FAILED')
    when 'DOWNLOADING' then p_to_status in ('TRANSCRIBING','FAILED')
    when 'TRANSCRIBING' then p_to_status in ('ANALYZING','FAILED')
    when 'ANALYZING' then p_to_status in ('SELECTING','FAILED')
    when 'SELECTING' then p_to_status in ('GENERATING','FAILED')
    when 'GENERATING' then p_to_status in ('RENDERING','FAILED')
    when 'RENDERING' then p_to_status in ('COMPLETED','FAILED')
    else false
  end;

  if not v_allowed then
    raise exception 'INVALID_JOB_TRANSITION:%->%', p_from_status, p_to_status;
  end if;

  return query
  update public.jobs j
     set engine_status = p_to_status,
         status = case when p_to_status = 'COMPLETED' then 'completed' else 'processing' end,
         lease_id = case when p_to_status = 'COMPLETED' then null else j.lease_id end,
         leased_until = case when p_to_status = 'COMPLETED' then null else j.leased_until end
   where j.id = p_job_id
     and j.lease_id = p_lease_id
     and j.engine_status = p_from_status
     and j.leased_until > now()
  returning true;
end;
$$;

create or replace function public.fail_content_engine_job(
  p_job_id uuid,
  p_lease_id uuid,
  p_error jsonb
)
returns table (updated boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'WORKER_SERVICE_ROLE_REQUIRED';
  end if;

  return query
  update public.jobs j
     set engine_status = 'FAILED',
         status = 'failed',
         error_details = p_error,
         lease_id = null,
         leased_until = null
   where j.id = p_job_id
     and j.lease_id = p_lease_id
     and j.engine_status <> 'COMPLETED'
  returning true;
end;
$$;

revoke all on function public.update_content_engine_stage(uuid,text,text,uuid,numeric) from public, anon, authenticated;
revoke all on function public.fail_content_engine_job(uuid,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.update_content_engine_stage(uuid,text,text,uuid,numeric) to service_role;
grant execute on function public.fail_content_engine_job(uuid,uuid,jsonb) to service_role;
