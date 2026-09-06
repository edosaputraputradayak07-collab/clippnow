import { start } from 'workflow/api';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getBearerToken, getMobileUser } from '@/lib/auth/mobile-request';
import { getClientIp, logSecurityEvent, securityGuard } from '@/lib/security/defense';
import { noStoreHeaders, sameOrigin } from '@/lib/security/request';
import { buildYouTubeProjectRequest } from '@/lib/vidklipral/ingest/youtube-project-request';
import { vidklipralYouTubeIngestWorkflow } from '@/workflows/vidklipral-youtube-ingest';

export async function POST(request: Request) {
  const ip = getClientIp(request.headers) ?? 'unknown';
  if (!(await securityGuard(`youtube-ingest:${ip}`, 5, 60))) {
    await logSecurityEvent({ eventType: 'rate_limit_youtube_ingest', severity: 'warning', request });
    return NextResponse.json({ error: 'Terlalu banyak permintaan YouTube. Coba lagi sebentar.' }, { status: 429, headers: noStoreHeaders() });
  }

  const isMobile = Boolean(getBearerToken(request));
  if (!isMobile && !sameOrigin(request)) {
    await logSecurityEvent({ eventType: 'invalid_origin_youtube_ingest', severity: 'warning', request });
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403, headers: noStoreHeaders() });
  }

  const mobileUser = isMobile ? await getMobileUser(request) : null;
  const supabase = mobileUser?.client ?? await createClient();
  const user = mobileUser?.user ?? (await supabase.auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders() });

  const body = await request.json().catch(() => ({}));
  let input: ReturnType<typeof buildYouTubeProjectRequest>;
  try {
    input = buildYouTubeProjectRequest({ url: body.url, name: body.name });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unsupported video source' }, { status: 400, headers: noStoreHeaders() });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('plan').eq('id', user.id).single();
  const owner = profile?.plan === 'owner';
  const creditReference = crypto.randomUUID();

  const { data: project, error: projectError } = await supabase.from('projects').insert({
    user_id: user.id,
    name: input.name,
    original_filename: `${input.name}.mp4`.slice(0, 255),
    start_seconds: 0,
    end_seconds: 0,
    format: '9:16',
    source_path: `${user.id}/sources/${creditReference}.mp4`,
    status: 'queued',
    credit_reference: creditReference,
  }).select('id,credit_reference').single();

  if (projectError || !project) {
    return NextResponse.json({ error: 'Gagal membuat project YouTube.' }, { status: 500, headers: noStoreHeaders() });
  }

  if (!owner) {
    const { data: balance, error: creditError } = await admin.rpc('reserve_clippnow_credit', { p_user_id: user.id, p_reference: creditReference });
    if (creditError) {
      await supabase.from('projects').delete().eq('id', project.id).eq('user_id', user.id);
      const status = creditError.message.includes('insufficient_credits') ? 402 : 500;
      return NextResponse.json({ error: status === 402 ? 'Kredit kamu habis. Beli paket untuk melanjutkan.' : 'Gagal menggunakan kredit.' }, { status, headers: noStoreHeaders() });
    }

    const { data: job, error: jobError } = await admin.from('jobs').insert({ user_id: user.id, project_id: project.id, source_path: project.id, status: 'queued', progress: 0 }).select('id').single();
    if (jobError || !job) {
      await admin.rpc('release_clippnow_credit', { p_user_id: user.id, p_reference: creditReference });
      await supabase.from('projects').delete().eq('id', project.id).eq('user_id', user.id);
      return NextResponse.json({ error: 'Gagal membuat ingestion job.' }, { status: 500, headers: noStoreHeaders() });
    }

    try {
      const run = await start(vidklipralYouTubeIngestWorkflow, [{ projectId: project.id, jobId: job.id, userId: user.id, url: input.url }]);
      return NextResponse.json({ project_id: project.id, job_id: job.id, run_id: run.runId, status: 'queued', credits_remaining: balance }, { headers: noStoreHeaders() });
    } catch (error) {
      await admin.from('jobs').update({ status: 'failed', error_code: 'WORKFLOW_START_FAILED', error_message: error instanceof Error ? error.message : 'Workflow start failed', failed_at: new Date().toISOString() }).eq('id', job.id).eq('user_id', user.id);
      await supabase.from('projects').update({ status: 'failed' }).eq('id', project.id).eq('user_id', user.id);
      await admin.rpc('release_clippnow_credit', { p_user_id: user.id, p_reference: creditReference });
      return NextResponse.json({ error: 'Gagal menjalankan YouTube ingestion workflow.' }, { status: 500, headers: noStoreHeaders() });
    }
  }

  const { data: job, error: jobError } = await admin.from('jobs').insert({ user_id: user.id, project_id: project.id, source_path: project.id, status: 'queued', progress: 0 }).select('id').single();
  if (jobError || !job) {
    await supabase.from('projects').delete().eq('id', project.id).eq('user_id', user.id);
    return NextResponse.json({ error: 'Gagal membuat ingestion job.' }, { status: 500, headers: noStoreHeaders() });
  }

  try {
    const run = await start(vidklipralYouTubeIngestWorkflow, [{ projectId: project.id, jobId: job.id, userId: user.id, url: input.url }]);
    return NextResponse.json({ project_id: project.id, job_id: job.id, run_id: run.runId, status: 'queued', credits_remaining: null }, { headers: noStoreHeaders() });
  } catch (error) {
    await admin.from('jobs').update({ status: 'failed', error_code: 'WORKFLOW_START_FAILED', error_message: error instanceof Error ? error.message : 'Workflow start failed', failed_at: new Date().toISOString() }).eq('id', job.id).eq('user_id', user.id);
    await supabase.from('projects').update({ status: 'failed' }).eq('id', project.id).eq('user_id', user.id);
    return NextResponse.json({ error: 'Gagal menjalankan YouTube ingestion workflow.' }, { status: 500, headers: noStoreHeaders() });
  }
}
