-- Keep long-running worker executions owned by the same worker.
-- A heartbeat extends only an active lease that still belongs to the caller.

create or replace function public.renew_content_engine_lease(
  p_job_id uuid,
  p_lease_id uuid,
  p_lease_ms integer default 300000
)
returns table(renewed boolean, leased_until timestamptz)
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
  update public.jobs j
  set leased_until = now() + (p_lease_ms::text || ' milliseconds')::interval
  where j.id = p_job_id
    and j.lease_id = p_lease_id
    and j.status = 'processing'
    and j.engine_status not in ('COMPLETED','FAILED')
    and j.leased_until > now()
  returning true, j.leased_until;
end;
$$;

revoke all on function public.renew_content_engine_lease(uuid,uuid,integer) from public, anon, authenticated;
grant execute on function public.renew_content_engine_lease(uuid,uuid,integer) to service_role;
