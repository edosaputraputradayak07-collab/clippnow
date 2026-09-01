begin;

alter table public.payments
  drop constraint if exists payments_user_id_fkey;

alter table public.payments
  drop constraint if exists payments_auth_user_fkey;

alter table public.payments
  alter column user_id drop not null;

alter table public.payments
  add constraint payments_auth_user_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

commit;
