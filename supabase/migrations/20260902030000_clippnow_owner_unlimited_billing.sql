-- ClippNow owner accounts are permanently exempt from credit consumption.
-- The owner role is assigned explicitly in public.profiles.plan = 'owner'.

create or replace function public.reserve_clippnow_credit(
  p_user_id uuid,
  p_reference text
) returns integer
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_balance integer;
  v_plan text;
begin
  if p_reference is null or length(trim(p_reference)) < 1 or length(p_reference) > 128 then
    raise exception 'invalid_credit_reference';
  end if;

  select credits, plan into v_balance, v_plan
  from public.profiles
  where id = p_user_id;

  if v_balance is null then
    raise exception 'profile_not_found';
  end if;

  if v_plan = 'owner' then
    return v_balance;
  end if;

  if exists (
    select 1
    from public.credit_transactions
    where user_id = p_user_id
      and type = 'usage'
      and reference_id = p_reference
  ) then
    return v_balance;
  end if;

  update public.profiles
  set credits = credits - 1, updated_at = now()
  where id = p_user_id and credits > 0
  returning credits into v_balance;

  if v_balance is null then
    raise exception 'insufficient_credits';
  end if;

  insert into public.credit_transactions(user_id, amount, type, reference_id, description)
  values(p_user_id, -1, 'usage', p_reference, 'Clip processing credit');

  return v_balance;
end;
$$;

revoke all on function public.reserve_clippnow_credit(uuid,text) from public, anon, authenticated;
grant execute on function public.reserve_clippnow_credit(uuid,text) to service_role;

create or replace function public.release_clippnow_credit(
  p_user_id uuid,
  p_reference text
) returns integer
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_balance integer;
  v_plan text;
begin
  select credits, plan into v_balance, v_plan
  from public.profiles
  where id = p_user_id;

  if v_balance is null then
    raise exception 'profile_not_found';
  end if;

  if v_plan = 'owner' then
    return v_balance;
  end if;

  if not exists(
    select 1 from public.credit_transactions
    where user_id=p_user_id and type='usage' and reference_id=p_reference
  ) then
    return v_balance;
  end if;

  if exists(
    select 1 from public.credit_transactions
    where user_id=p_user_id and type='release' and reference_id=p_reference
  ) then
    return v_balance;
  end if;

  update public.profiles
  set credits=credits+1, updated_at=now()
  where id=p_user_id
  returning credits into v_balance;

  insert into public.credit_transactions(user_id,amount,type,reference_id,description)
  values(p_user_id,1,'release',p_reference,'Render job creation rollback');

  return v_balance;
end;
$$;

revoke all on function public.release_clippnow_credit(uuid,text) from public, anon, authenticated;
grant execute on function public.release_clippnow_credit(uuid,text) to service_role;
