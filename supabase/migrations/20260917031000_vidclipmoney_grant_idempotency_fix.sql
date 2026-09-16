create or replace function public.grant_credits(p_user_id uuid, p_amount bigint, p_idempotency_key text, p_description text default null)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare v_balance bigint; v_inserted integer;
begin
  if p_amount <= 0 or p_idempotency_key is null or btrim(p_idempotency_key) = '' then raise exception 'INVALID_CREDIT_GRANT'; end if;
  insert into public.credit_wallets(user_id) values (p_user_id) on conflict (user_id) do nothing;
  insert into public.credit_ledger(user_id, amount, entry_type, idempotency_key, description)
  values (p_user_id, p_amount, 'grant', p_idempotency_key, p_description)
  on conflict (idempotency_key) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 1 then
    update public.credit_wallets set balance = balance + p_amount, updated_at = now() where user_id = p_user_id returning balance into v_balance;
  else
    select balance into v_balance from public.credit_wallets where user_id = p_user_id;
  end if;
  return v_balance;
end;
$$;
