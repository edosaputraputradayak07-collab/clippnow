import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../src/lib/auth';
import { creditsForDuration } from '../../../../../src/lib/credits';
import { createSupabaseServerClient } from '../../../../../src/lib/supabase/server';

type RouteContext = { params: Promise<{ jobId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  const { jobId } = await context.params;
  const supabase = await createSupabaseServerClient();

  const { data: previous, error: previousError } = await supabase
    .from('jobs')
    .select('id,project_id,user_id,status,engine_status,mode')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (previousError) return NextResponse.json({ error: 'JOB_READ_FAILED' }, { status: 500 });
  if (!previous) return NextResponse.json({ error: 'JOB_NOT_FOUND' }, { status: 404 });
  if (previous.status !== 'failed' && previous.engine_status !== 'FAILED') {
    return NextResponse.json({ error: 'JOB_NOT_RETRYABLE' }, { status: 409 });
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id,user_id,duration_ms,mode,source_path,source_url,status')
    .eq('id', previous.project_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (projectError) return NextResponse.json({ error: 'PROJECT_READ_FAILED' }, { status: 500 });
  if (!project) return NextResponse.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 });
  if (!project.source_path && !project.source_url) return NextResponse.json({ error: 'PROJECT_SOURCE_REQUIRED' }, { status: 400 });

  const durationMs = Number(project.duration_ms);
  if (!Number.isFinite(durationMs) || durationMs <= 0) return NextResponse.json({ error: 'SOURCE_DURATION_REQUIRED' }, { status: 422 });

  const credits = creditsForDuration(durationMs);
  const newJobId = randomUUID();
  const { data: wallet, error: reserveError } = await supabase.rpc('reserve_user_credits', {
    p_user_id: user.id,
    p_amount: credits,
    p_idempotency_key: `job:${newJobId}:reserve`,
    p_reference_id: newJobId,
  });

  if (reserveError) {
    return NextResponse.json(
      { error: reserveError.message === 'INSUFFICIENT_CREDITS' ? 'INSUFFICIENT_CREDITS' : 'CREDIT_RESERVATION_FAILED' },
      { status: reserveError.message === 'INSUFFICIENT_CREDITS' ? 402 : 500 },
    );
  }

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      id: newJobId,
      project_id: project.id,
      user_id: user.id,
      kind: 'content_engine',
      status: 'queued',
      engine_status: 'QUEUED',
      mode: project.mode ?? previous.mode,
      attempts: 0,
      input_path: project.source_path,
      source_path: project.source_path,
      settings: { mode: project.mode ?? previous.mode, retryOf: previous.id },
    })
    .select('*')
    .single();

  if (jobError) {
    await supabase.rpc('release_user_credits', { p_user_id: user.id, p_amount: credits, p_idempotency_key: `job:${newJobId}:release`, p_reference_id: newJobId });
    return NextResponse.json({ error: 'JOB_CREATE_FAILED' }, { status: 500 });
  }

  const { error: projectUpdateError } = await supabase
    .from('projects')
    .update({ status: 'processing' })
    .eq('id', project.id)
    .eq('user_id', user.id);

  if (projectUpdateError) {
    await supabase.rpc('release_user_credits', { p_user_id: user.id, p_amount: credits, p_idempotency_key: `job:${newJobId}:release`, p_reference_id: newJobId });
    await supabase.from('jobs').update({ status: 'failed', engine_status: 'FAILED', error_details: { code: 'PROJECT_STATUS_UPDATE_FAILED' } }).eq('id', job.id).eq('user_id', user.id);
    return NextResponse.json({ error: 'PROJECT_STATUS_UPDATE_FAILED' }, { status: 500 });
  }

  return NextResponse.json({ job, credits, wallet, retryOf: previous.id }, { status: 202 });
}
