create table if not exists public.youtube_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  channel_id text not null,
  channel_title text not null,
  channel_description text,
  channel_thumbnail_url text,
  uploads_playlist_id text,
  access_token_encrypted text not null,
  refresh_token_encrypted text not null,
  access_token_expires_at timestamptz not null,
  scope text not null default 'https://www.googleapis.com/auth/youtube.readonly',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, channel_id)
);

create index if not exists youtube_accounts_user_id_idx on public.youtube_accounts(user_id);

alter table public.youtube_accounts enable row level security;

create or replace function public.set_youtube_accounts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists youtube_accounts_updated_at on public.youtube_accounts;
create trigger youtube_accounts_updated_at
before update on public.youtube_accounts
for each row execute function public.set_youtube_accounts_updated_at();
