-- Keep the credit ledger contract aligned with release_clippnow_credit().
-- Render-job creation can roll back a reserved credit using type='release'.
alter table public.credit_transactions drop constraint if exists credit_transactions_type_check;
alter table public.credit_transactions add constraint credit_transactions_type_check
  check (type = any (array[
    'trial'::text,
    'purchase'::text,
    'usage'::text,
    'release'::text,
    'refund'::text,
    'adjustment'::text
  ]));
