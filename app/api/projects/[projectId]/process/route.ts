import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../src/lib/auth';
import { creditsForDuration } from '../../../../../src/lib/credits';
import { createSupabaseServerClient } from '../../../../../src/lib/supabase/server';

type RouteContext = { params: Promise<{ projectId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  const { projectId } = await context.params;
  const supabase = await createSupabaseServerClient();
  const { data: project, error: projectError } = await supabase.from('projects').select('id,user_id,duration_ms,mode,source_path,source_url,status').eq('id', projectId).eq('user_id', user.id).maybeSingle();
  if (projectError) return NextResponse.json({ error: 'PROJECT_READ_FAILED' }, { status: 500 });
  if (!project) return NextResponse.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 });
  if (project.status === 'processing') return NextResponse.json({ error: 'PROJECT_ALREADY_PROCESSING' }, { status: 409 });
  if (!project.source_path && !project.source_url) return NextResponse.json({ error: 'PROJECT_SOURCE_REQUIRED' }, { status: 400 });
  const durationMs = Number(project.duration_ms || 60_000);
  const credits = creditsForDuration(durationMs);
  const jobId = randomUUID();
  const { data: wallet, error: reserveError } = await supabase.rpc('reserve_user_credits', { p_user_id: user.id, p_amount: credits, p_idempotency_key: `job:${jobId}:reserve`, p_reference_id: jobId });
  if (reserveError) return NextResponse.json({ error: reserveError.message === 'INSUFFICIENT_CREDITS' ? 'INSUFFICIENT_CREDITS' : 'CREDIT_RESERVATION_FAILED' }, { status: reserveError.message === 'INSUFFICIENT_CREDITS' ? 402 : 500 });
  const { data: job, error: jobError } = await supabase.from('jobs').insert({ id: jobId, project_id: project.id, user_id: user.id, kind: 'content_engine', status: 'queued', engine_status: 'QUEUED', mode: project.mode, attempts: 0, input_path: project.source_path, source_path: project.source_path, settings: { mode: project.mode } }).select('*').single();
  if (jobError) {
    await supabase.rpc('release_user_credits', { p_user_id: user.id, p_amount: credits, p_idempotency_key: `job:${jobId}:release`, p_reference_id: jobId });
    return NextResponse.json({ error: 'JOB_CREATE_FAILED' }, { status: 500 });
  }
  await supabase.from('projects').update({ status: 'processing' }).eq('id', project.id).eq('user_id', user.id);
  await supabase.from('usage_events').insert({ user_id: user.id, project_id: project.id, job_id: job.id, event_type: 'job_queued', credits, metadata: { mode: project.mode } });
  return NextResponse.json({ job, credits, wallet }, { status: 202 });
}
