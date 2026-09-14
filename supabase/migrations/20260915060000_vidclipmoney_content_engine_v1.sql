-- VidClipMoney Content Engine V1
-- Additive migration: preserves existing Vidklipral compatibility tables/RPCs.

create extension if not exists pgcrypto;

alter table public.projects
  add column if not exists mode text not null default 'affiliate',
  add column if not exists guest_token text,
  add column if not exists duration_ms bigint,
  add column if not exists source_metadata jsonb not null default '{}'::jsonb;

alter table public.projects
  drop constraint if exists projects_mode_check;
alter table public.projects
  add constraint projects_mode_check check (mode in ('affiliate','seller','live_seller','podcast','educator'));

alter table public.jobs
  add column if not exists engine_status text not null default 'QUEUED',
  add column if not exists mode text not null default 'affiliate',
  add column if not exists error_details jsonb not null default '{}'::jsonb;

alter table public.jobs
  drop constraint if exists jobs_engine_status_check;
alter table public.jobs
  add constraint jobs_engine_status_check check (engine_status in ('QUEUED','DOWNLOADING','TRANSCRIBING','ANALYZING','SELECTING','GENERATING','RENDERING','COMPLETED','FAILED'));

alter table public.jobs
  drop constraint if exists jobs_mode_check;
alter table public.jobs
  add constraint jobs_mode_check check (mode in ('affiliate','seller','live_seller','podcast','educator'));

alter table public.clips
  add column if not exists mode text not null default 'affiliate',
  add column if not exists rank smallint,
  add column if not exists ai_score numeric(5,2),
  add column if not exists hook_score numeric(5,2),
  add column if not exists retention_score numeric(5,2),
  add column if not exists relevance_score numeric(5,2),
  add column if not exists diversity_score numeric(5,2),
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.clips
  drop constraint if exists clips_mode_check;
alter table public.clips
  add constraint clips_mode_check check (mode in ('affiliate','seller','live_seller','podcast','educator'));

alter table public.clips
  drop constraint if exists clips_scores_check;
alter table public.clips
  add constraint clips_scores_check check (
    (ai_score is null or ai_score between 0 and 100) and
    (hook_score is null or hook_score between 0 and 100) and
    (retention_score is null or retention_score between 0 and 100) and
    (relevance_score is null or relevance_score between 0 and 100) and
    (diversity_score is null or diversity_score between 0 and 100)
  );

create table if not exists public.transcripts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade,
  language text not null default 'id',
  text text not null,
  words jsonb not null default '[]'::jsonb,
  confidence numeric(5,4),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, version)
);

create table if not exists public.segments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  transcript_id uuid references public.transcripts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  sequence_no integer not null,
  start_ms bigint not null,
  end_ms bigint not null,
  text text not null,
  embedding jsonb,
  signals jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (start_ms >= 0 and end_ms > start_ms),
  unique(project_id, sequence_no)
);

create table if not exists public.clip_assets (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid not null references public.clips(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  kind text not null,
  storage_path text not null,
  mime_type text not null,
  width integer,
  height integer,
  duration_ms bigint,
  file_size bigint,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (kind in ('video','subtitle','thumbnail','audio'))
);

create table if not exists public.credit_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance bigint not null default 0 check (balance >= 0),
  reserved bigint not null default 0 check (reserved >= 0),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  amount bigint not null,
  entry_type text not null,
  reference_type text,
  reference_id text,
  idempotency_key text not null unique,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (entry_type in ('grant','purchase','reserve','consume','release','refund','adjustment'))
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  provider text not null,
  external_id text not null,
  status text not null default 'pending',
  amount bigint not null default 0 check (amount >= 0),
  currency text not null default 'IDR',
  credits bigint not null default 0 check (credits >= 0),
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, external_id),
  check (status in ('pending','paid','failed','refunded','cancelled'))
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text,
  external_id text,
  plan text not null,
  status text not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, external_id),
  check (status in ('trialing','active','past_due','cancelled','expired'))
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  event_type text not null,
  credits bigint not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists projects_user_id_created_at_idx on public.projects(user_id, created_at desc);
create index if not exists jobs_project_id_created_at_idx on public.jobs(project_id, created_at desc);
create index if not exists jobs_engine_status_idx on public.jobs(engine_status);
create index if not exists transcripts_project_id_idx on public.transcripts(project_id);
create index if not exists segments_project_id_start_idx on public.segments(project_id, start_ms);
create index if not exists clips_project_id_rank_idx on public.clips(project_id, rank);
create index if not exists clip_assets_clip_id_idx on public.clip_assets(clip_id);
create index if not exists credit_ledger_user_created_idx on public.credit_ledger(user_id, created_at desc);
create index if not exists payments_user_created_idx on public.payments(user_id, created_at desc);
create index if not exists usage_events_user_created_idx on public.usage_events(user_id, created_at desc);

alter table public.transcripts enable row level security;
alter table public.segments enable row level security;
alter table public.clip_assets enable row level security;
alter table public.credit_wallets enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.payments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_events enable row level security;

create policy "transcripts_owner_select" on public.transcripts for select using (auth.uid() = user_id);
create policy "transcripts_owner_write" on public.transcripts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "segments_owner_select" on public.segments for select using (auth.uid() = user_id);
create policy "segments_owner_write" on public.segments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "clip_assets_owner_select" on public.clip_assets for select using (auth.uid() = user_id);
create policy "clip_assets_owner_write" on public.clip_assets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "credit_wallets_owner_select" on public.credit_wallets for select using (auth.uid() = user_id);
create policy "credit_wallets_owner_write" on public.credit_wallets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "credit_ledger_service_role" on public.credit_ledger for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "payments_owner_select" on public.payments for select using (auth.uid() = user_id);
create policy "payments_owner_write" on public.payments for insert with check (auth.uid() = user_id);

create policy "subscriptions_owner_select" on public.subscriptions for select using (auth.uid() = user_id);

create policy "usage_events_owner_select" on public.usage_events for select using (auth.uid() = user_id);
create policy "usage_events_owner_insert" on public.usage_events for insert with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('source-videos', 'source-videos', false, 524288000, array['video/mp4','video/quicktime','video/webm'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rendered-clips', 'rendered-clips', false, 524288000, array['video/mp4','video/webm','text/vtt'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "source_videos_owner_access" on storage.objects
  for all using (bucket_id = 'source-videos' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'source-videos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "rendered_clips_owner_access" on storage.objects
  for all using (bucket_id = 'rendered-clips' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'rendered-clips' and auth.uid()::text = (storage.foldername(name))[1]);
