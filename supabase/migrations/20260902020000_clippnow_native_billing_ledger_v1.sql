create table if not exists public.native_purchase_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('ios','android')),
  product_id text not null,
  store_transaction_id text not null,
  state text not null,
  credits_granted integer not null default 0 check (credits_granted >= 0),
  created_at timestamptz not null default now(),
  verified_at timestamptz not null default now(),
  unique (platform, store_transaction_id)
);

create index if not exists native_purchase_transactions_user_idx
  on public.native_purchase_transactions(user_id, created_at desc);

alter table public.native_purchase_transactions enable row level security;

create or replace function public.grant_clippnow_native_purchase(
  p_user_id uuid,
  p_platform text,
  p_product_id text,
  p_store_transaction_id text,
  p_state text,
  p_credits integer
) returns table (granted boolean, credits integer)
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_credits integer;
begin
  if p_platform not in ('ios','android') or p_credits < 0 or p_credits > 10000 then
    raise exception 'invalid_native_purchase';
  end if;

  if exists (
    select 1 from public.native_purchase_transactions
    where platform=p_platform and store_transaction_id=p_store_transaction_id
  ) then
    select profiles.credits into v_credits from public.profiles where profiles.id=p_user_id;
    if v_credits is null then raise exception 'profile_not_found'; end if;
    return query select false, v_credits;
    return;
  end if;

  insert into public.native_purchase_transactions(
    user_id, platform, product_id, store_transaction_id, state, credits_granted
  ) values (
    p_user_id, p_platform, p_product_id, p_store_transaction_id, p_state, p_credits
  );

  update public.profiles
    set credits = credits + p_credits, updated_at = now()
    where id = p_user_id
    returning profiles.credits into v_credits;

  if v_credits is null then raise exception 'profile_not_found'; end if;

  if p_credits > 0 then
    insert into public.credit_transactions(user_id, amount, type, reference_id, description)
    values (
      p_user_id,
      p_credits,
      'purchase',
      left(p_platform || ':' || p_store_transaction_id, 128),
      'Native store purchase: ' || p_product_id
    );
  end if;

  return query select true, v_credits;
end;
$$;

revoke all on function public.grant_clippnow_native_purchase(uuid,text,text,text,text,integer) from public, anon, authenticated;
grant execute on function public.grant_clippnow_native_purchase(uuid,text,text,text,text,integer) to service_role;
