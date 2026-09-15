alter table public.projects
  add column if not exists idempotency_key text;

create unique index if not exists projects_user_id_idempotency_key_uidx
  on public.projects(user_id, idempotency_key)
  where idempotency_key is not null;
