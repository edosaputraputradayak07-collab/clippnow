-- Vidklipral V1 foundation
create extension if not exists pgcrypto;

create type public.app_role as enum ('user','admin','owner');
create type public.project_status as enum ('draft','queued','processing','completed','failed','cancelled');
create type public.job_status as enum ('queued','processing','completed','failed','cancelled');
create type public.credit_transaction_type as enum ('grant','purchase','reserve','consume','release','refund','adjustment');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  source_type text not null check (source_type in ('upload','youtube','url')),
  source_url text,
  storage_path text,
  status public.project_status not null default 'draft',
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('transcribe','analyze','render')),
  status public.job_status not null default 'queued',
  attempts integer not null default 0 check (attempts >= 0),
  idempotency_key text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create table public.clips (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  start_seconds numeric(12,3) not null check (start_seconds >= 0),
  end_seconds numeric(12,3) not null check (end_seconds > start_seconds),
  storage_path text,
  score numeric(6,3),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.credit_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance bigint not null default 0 check (balance >= 0),
  reserved bigint not null default 0 check (reserved >= 0),
  unlimited boolean not null default false,
  updated_at timestamptz not null default now(),
  check (unlimited or reserved <= balance)
);

create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.credit_transaction_type not null,
  amount bigint not null check (amount <> 0),
  reference_id uuid,
  idempotency_key text,
  description text,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create table public.billing_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text,
  provider_transaction_id text,
  amount_minor bigint not null default 0 check (amount_minor >= 0),
  currency text not null default 'IDR',
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded','cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_transaction_id)
);

create index projects_user_created_idx on public.projects(user_id, created_at desc);
create index jobs_user_status_idx on public.jobs(user_id, status, created_at desc);
create index jobs_project_idx on public.jobs(project_id);
create index clips_user_created_idx on public.clips(user_id, created_at desc);
create index credit_tx_user_created_idx on public.credit_transactions(user_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  insert into public.credit_accounts (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.jobs enable row level security;
alter table public.clips enable row level security;
alter table public.credit_accounts enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.billing_transactions enable row level security;

create policy profiles_self_select on public.profiles for select using (id = auth.uid());
create policy profiles_self_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy projects_owner_all on public.projects for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy jobs_owner_select on public.jobs for select using (user_id = auth.uid());
create policy clips_owner_all on public.clips for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy credits_self_select on public.credit_accounts for select using (user_id = auth.uid());
create policy credit_tx_self_select on public.credit_transactions for select using (user_id = auth.uid());
create policy billing_self_select on public.billing_transactions for select using (user_id = auth.uid());

-- Server-side owner check. Owner assignment is deliberately not client-writable.
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'owner');
$$;

grant execute on function public.is_owner() to authenticated;
