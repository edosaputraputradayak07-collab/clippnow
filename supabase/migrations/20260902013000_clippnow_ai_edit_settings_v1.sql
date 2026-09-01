alter table public.projects
  add column if not exists edit_mode text not null default 'manual',
  add column if not exists subtitle_style text,
  add column if not exists viral_score integer,
  add column if not exists edit_plan jsonb;

alter table public.projects
  drop constraint if exists projects_edit_mode_check;
alter table public.projects
  add constraint projects_edit_mode_check check (edit_mode in ('manual','viral'));

alter table public.projects
  drop constraint if exists projects_viral_score_check;
alter table public.projects
  add constraint projects_viral_score_check check (viral_score is null or (viral_score between 0 and 100));
