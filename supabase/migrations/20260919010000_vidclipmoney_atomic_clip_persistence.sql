create or replace function public.persist_clip_with_asset(
  p_project_id uuid,
  p_user_id uuid,
  p_job_id uuid,
  p_mode text,
  p_rank integer,
  p_start_ms bigint,
  p_end_ms bigint,
  p_title text,
  p_caption text,
  p_hook text,
  p_ai_score numeric,
  p_segment_id uuid,
  p_storage_path text,
  p_duration_ms bigint
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clip_id uuid;
begin
  if p_rank < 1 or p_rank > 5 then
    raise exception 'CLIP_RANK_INVALID';
  end if;
  if p_start_ms < 0 or p_end_ms <= p_start_ms then
    raise exception 'CLIP_TIMING_INVALID';
  end if;
  if p_storage_path is null or p_storage_path = '' or left(p_storage_path, 1) = '/' or p_storage_path like '%..%' then
    raise exception 'CLIP_OUTPUT_PATH_INVALID';
  end if;

  insert into public.clips (
    project_id, user_id, job_id, mode, rank, start_ms, end_ms,
    title, caption, hook, ai_score, metadata
  ) values (
    p_project_id, p_user_id, p_job_id, p_mode, p_rank, p_start_ms, p_end_ms,
    p_title, p_caption, p_hook, p_ai_score, jsonb_build_object('segment_id', p_segment_id)
  )
  returning id into v_clip_id;

  insert into public.clip_assets (
    clip_id, project_id, user_id, kind, storage_path, mime_type,
    width, height, duration_ms, metadata
  ) values (
    v_clip_id, p_project_id, p_user_id, 'video', p_storage_path, 'video/mp4',
    1080, 1920, p_duration_ms, jsonb_build_object('rank', p_rank)
  );

  return v_clip_id;
end;
$$;

revoke all on function public.persist_clip_with_asset(
  uuid, uuid, uuid, text, integer, bigint, bigint, text, text, text,
  numeric, uuid, text, bigint
) from public, anon, authenticated;

grant execute on function public.persist_clip_with_asset(
  uuid, uuid, uuid, text, integer, bigint, bigint, text, text, text,
  numeric, uuid, text, bigint
) to service_role;
