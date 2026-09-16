create or replace function public.grant_credits(p_user_id uuid, p_amount bigint, p_idempotency_key text, p_description text default null)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare v_balance bigint; v_reserved bigint;
begin
  if p_amount <= 0 or p_idempotency_key is null or btrim(p_idempotency_key) = '' then raise exception 'INVALID_CREDIT_GRANT'; end if;
  insert into public.credit_wallets(user_id) values (p_user_id) on conflict (user_id) do nothing;
  insert into public.credit_ledger(user_id, amount, entry_type, idempotency_key, description)
  values (p_user_id, p_amount, 'grant', p_idempotency_key, p_description)
  on conflict (idempotency_key) do nothing;
  update public.credit_wallets set balance = balance + case when exists (select 1 from public.credit_ledger where idempotency_key = p_idempotency_key and user_id = p_user_id) then p_amount else 0 end, updated_at = now() where user_id = p_user_id returning balance, reserved into v_balance, v_reserved;
  return v_balance;
end;
$$;

create or replace function public.reserve_user_credits(p_user_id uuid, p_amount bigint, p_idempotency_key text, p_reference_id text default null)
returns public.credit_wallets
language plpgsql
security definer
set search_path = public
as $$
declare v_wallet public.credit_wallets;
begin
  if p_amount <= 0 or p_idempotency_key is null or btrim(p_idempotency_key) = '' then raise exception 'INVALID_CREDIT_RESERVATION'; end if;
  insert into public.credit_wallets(user_id) values (p_user_id) on conflict (user_id) do nothing;
  select * into v_wallet from public.credit_wallets where user_id = p_user_id for update;
  if v_wallet.balance - v_wallet.reserved < p_amount then raise exception 'INSUFFICIENT_CREDITS'; end if;
  if not exists (select 1 from public.credit_ledger where idempotency_key = p_idempotency_key) then
    update public.credit_wallets set reserved = reserved + p_amount, updated_at = now() where user_id = p_user_id returning * into v_wallet;
    insert into public.credit_ledger(user_id, amount, entry_type, reference_type, reference_id, idempotency_key, description) values (p_user_id, p_amount, 'reserve', 'job', p_reference_id, p_idempotency_key, 'Reserved for processing');
  end if;
  return v_wallet;
end;
$$;

create or replace function public.release_user_credits(p_user_id uuid, p_amount bigint, p_idempotency_key text, p_reference_id text default null)
returns public.credit_wallets
language plpgsql
security definer
set search_path = public
as $$
declare v_wallet public.credit_wallets;
begin
  if p_amount <= 0 or p_idempotency_key is null or btrim(p_idempotency_key) = '' then raise exception 'INVALID_CREDIT_RELEASE'; end if;
  select * into v_wallet from public.credit_wallets where user_id = p_user_id for update;
  if not found or v_wallet.reserved < p_amount then raise exception 'RESERVED_CREDITS_INVALID'; end if;
  if not exists (select 1 from public.credit_ledger where idempotency_key = p_idempotency_key) then
    update public.credit_wallets set reserved = reserved - p_amount, updated_at = now() where user_id = p_user_id returning * into v_wallet;
    insert into public.credit_ledger(user_id, amount, entry_type, reference_type, reference_id, idempotency_key, description) values (p_user_id, p_amount, 'release', 'job', p_reference_id, p_idempotency_key, 'Released after failed processing');
  end if;
  return v_wallet;
end;
$$;

create or replace function public.consume_user_credits(p_user_id uuid, p_amount bigint, p_idempotency_key text, p_reference_id text default null)
returns public.credit_wallets
language plpgsql
security definer
set search_path = public
as $$
declare v_wallet public.credit_wallets;
begin
  if p_amount <= 0 or p_idempotency_key is null or btrim(p_idempotency_key) = '' then raise exception 'INVALID_CREDIT_CONSUME'; end if;
  select * into v_wallet from public.credit_wallets where user_id = p_user_id for update;
  if not found or v_wallet.reserved < p_amount then raise exception 'RESERVED_CREDITS_INVALID'; end if;
  if not exists (select 1 from public.credit_ledger where idempotency_key = p_idempotency_key) then
    update public.credit_wallets set balance = balance - p_amount, reserved = reserved - p_amount, updated_at = now() where user_id = p_user_id returning * into v_wallet;
    insert into public.credit_ledger(user_id, amount, entry_type, reference_type, reference_id, idempotency_key, description) values (p_user_id, -p_amount, 'consume', 'job', p_reference_id, p_idempotency_key, 'Consumed by completed processing');
  end if;
  return v_wallet;
end;
$$;

revoke all on function public.grant_credits(uuid,bigint,text,text) from public, anon, authenticated;
grant execute on function public.grant_credits(uuid,bigint,text,text) to service_role;
revoke all on function public.reserve_user_credits(uuid,bigint,text,text) from public, anon;
grant execute on function public.reserve_user_credits(uuid,bigint,text,text) to authenticated, service_role;
revoke all on function public.release_user_credits(uuid,bigint,text,text) from public, anon;
grant execute on function public.release_user_credits(uuid,bigint,text,text) to authenticated, service_role;
revoke all on function public.consume_user_credits(uuid,bigint,text,text) from public, anon;
grant execute on function public.consume_user_credits(uuid,bigint,text,text) to authenticated, service_role;
