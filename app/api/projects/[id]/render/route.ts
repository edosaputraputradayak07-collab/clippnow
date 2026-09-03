import { NextResponse } from 'next/server';
import { start } from 'workflow/api';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getBearerToken, getMobileUser } from '@/lib/auth/mobile-request';
import { getClientIp, logSecurityEvent, securityGuard } from '@/lib/security/defense';
import { noStoreHeaders, sameOrigin } from '@/lib/security/request';
import { buildRenderCreditReference } from '@/lib/billing/credit-reference';
import { startRenderWorkflow } from '@/workflows/render-video';

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(request.headers) ?? 'unknown';
  if (!(await securityGuard(`render:${ip}`, 10, 60))) {
    await logSecurityEvent({ eventType: 'rate_limit_render', severity: 'warning', request });
    return NextResponse.json({ error: 'Terlalu banyak permintaan render. Coba lagi sebentar.' }, { status: 429, headers: noStoreHeaders() });
  }

  const isMobile = Boolean(getBearerToken(request));
  if (!isMobile && !sameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403, headers: noStoreHeaders() });

  const mobileUser = isMobile ? await getMobileUser(request) : null;
  const supabase = mobileUser?.client ?? await createClient();
  const user = mobileUser?.user ?? (await supabase.auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders() });

  const { id } = await params;
  const admin = createAdminClient();
  const { data: job, error } = await admin.from('jobs').select('id,status,attempts').eq('project_id', id).eq('user_id', user.id).maybeSingle();
  if (error || !job) return NextResponse.json({ error: 'Render job tidak ditemukan.' }, { status: 404, headers: noStoreHeaders() });
  if (job.status === 'completed') return NextResponse.json({ status: 'completed' }, { headers: noStoreHeaders() });
  if (job.status === 'processing') return NextResponse.json({ status: 'processing' }, { status: 202, headers: noStoreHeaders() });

  if (job.status === 'failed') {
    const { data: project, error: projectError } = await admin.from('projects').select('id,credit_reference,status').eq('id', id).eq('user_id', user.id).maybeSingle();
    if (projectError || !project?.credit_reference) return NextResponse.json({ error: 'Project render tidak valid.' }, { status: 500, headers: noStoreHeaders() });

    const attempt = Number(job.attempts ?? 0) + 1;
    let retryReference: string;
    try { retryReference = buildRenderCreditReference(project.id, attempt); } catch { return NextResponse.json({ error: 'Batas percobaan render tercapai.' }, { status: 409, headers: noStoreHeaders() }); }

    const { error: creditError } = await admin.rpc('reserve_clippnow_credit', { p_user_id: user.id, p_reference: retryReference });
    if (creditError) {
      const status = creditError.message.includes('insufficient_credits') ? 402 : 500;
      return NextResponse.json({ error: status === 402 ? 'Kredit kamu habis. Beli paket untuk melanjutkan.' : 'Gagal menggunakan kredit untuk retry.' }, { status, headers: noStoreHeaders() });
    }

    const { error: projectUpdateError } = await admin.from('projects').update({ credit_reference: retryReference, status: 'queued', output_path: null, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).eq('credit_reference', project.credit_reference);
    if (projectUpdateError) {
      await admin.rpc('release_clippnow_credit', { p_user_id: user.id, p_reference: retryReference });
      return NextResponse.json({ error: 'Gagal menyiapkan retry render.' }, { status: 500, headers: noStoreHeaders() });
    }

    const { error: jobUpdateError } = await admin.from('jobs').update({ status: 'queued', progress: 0, error_code: null, error_message: null, failed_at: null, completed_at: null, started_at: null, worker_id: null, lease_expires_at: null, last_heartbeat_at: null, output_path: null, updated_at: new Date().toISOString() }).eq('id', job.id).eq('user_id', user.id).eq('status', 'failed');
    if (jobUpdateError) {
      await admin.from('projects').update({ credit_reference: project.credit_reference, status: 'failed', updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).eq('credit_reference', retryReference);
      await admin.rpc('release_clippnow_credit', { p_user_id: user.id, p_reference: retryReference });
      return NextResponse.json({ error: 'Gagal menyiapkan retry render.' }, { status: 500, headers: noStoreHeaders() });
    }
  }

  try {
    const run = await start(startRenderWorkflow, [job.id]);
    return NextResponse.json({ status: 'queued', run_id: run.runId }, { status: 202, headers: noStoreHeaders() });
  } catch {
    return NextResponse.json({ status: 'failed', error: 'Render gagal dijadwalkan. Coba lagi.' }, { status: 500, headers: noStoreHeaders() });
  }
}
