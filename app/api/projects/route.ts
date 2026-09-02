import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getBearerToken, getMobileUser } from '@/lib/auth/mobile-request';
import { logSecurityEvent, getClientIp, securityGuard } from '@/lib/security/defense';
import { noStoreHeaders, sameOrigin } from '@/lib/security/request';
import { validateRenderRequest } from '@/lib/rendering/validation';

export async function POST(request: Request) {
  const ip = getClientIp(request.headers) ?? 'unknown';
  if (!(await securityGuard(`projects:${ip}`, 20, 60))) {
    await logSecurityEvent({ eventType: 'rate_limit_projects', severity: 'warning', request });
    return NextResponse.json({ error: 'Terlalu banyak permintaan. Coba lagi sebentar.' }, { status: 429, headers: noStoreHeaders() });
  }

  const isMobile = Boolean(getBearerToken(request));
  if (!isMobile && !sameOrigin(request)) {
    await logSecurityEvent({ eventType: 'invalid_origin_projects', severity: 'warning', request });
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403, headers: noStoreHeaders() });
  }

  const mobileUser = isMobile ? await getMobileUser(request) : null;
  const supabase = mobileUser?.client ?? await createClient();
  const user = mobileUser?.user ?? (await supabase.auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders() });

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 120) : 'Untitled clip';
  const sourcePath = typeof body.source_path === 'string' && body.source_path.startsWith(`${user.id}/`) ? body.source_path : null;
  const validation = validateRenderRequest({ format: body.format, start_seconds: body.start_seconds, end_seconds: body.end_seconds });
  if (!sourcePath) return NextResponse.json({ error: 'Source video tidak valid.' }, { status: 400, headers: noStoreHeaders() });
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400, headers: noStoreHeaders() });

  const { format, start_seconds: start, end_seconds: end } = validation.value;
  const admin = createAdminClient();
  const { data: project, error: projectError } = await supabase.from('projects').insert({ user_id: user.id, name, original_filename: typeof body.original_filename === 'string' ? body.original_filename.slice(0, 255) : null, start_seconds: start, end_seconds: end, format, source_path: sourcePath, status: 'queued' }).select('id').single();
  if (projectError || !project) return NextResponse.json({ error: 'Gagal membuat project.' }, { status: 500, headers: noStoreHeaders() });

  const { data: balance, error: creditError } = await admin.rpc('reserve_clippnow_credit', { p_user_id: user.id, p_reference: project.id });
  if (creditError) {
    await supabase.from('projects').delete().eq('id', project.id);
    const message = creditError.message.includes('insufficient_credits') ? 'Kredit kamu habis. Beli paket untuk melanjutkan.' : 'Gagal menggunakan kredit.';
    return NextResponse.json({ error: message }, { status: creditError.message.includes('insufficient_credits') ? 402 : 500, headers: noStoreHeaders() });
  }

  const { data: job, error: jobError } = await admin.from('jobs').insert({ user_id: user.id, project_id: project.id, source_path: sourcePath, status: 'queued', progress: 0 }).select('id').single();
  if (jobError || !job) {
    await admin.rpc('release_clippnow_credit', { p_user_id: user.id, p_reference: project.id });
    await supabase.from('projects').delete().eq('id', project.id);
    return NextResponse.json({ error: 'Gagal membuat render job.' }, { status: 500, headers: noStoreHeaders() });
  }

  return NextResponse.json({ project_id: project.id, job_id: job.id, credits_remaining: balance }, { headers: noStoreHeaders() });
}
