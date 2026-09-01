import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { noStoreHeaders, sameOrigin } from '@/lib/security/request';

const MIN_CLIP_SECONDS = 0.1;
const MAX_CLIP_SECONDS = 60 * 10;

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403, headers: noStoreHeaders() });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders() });

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 120) : 'Untitled clip';
  const format = body.format;
  const sourcePath = typeof body.source_path === 'string' && body.source_path.startsWith(`${user.id}/`) ? body.source_path : null;
  const start = Number(body.start_seconds);
  const end = Number(body.end_seconds);

  if (!['9:16', '1:1', '16:9'].includes(format)) return NextResponse.json({ error: 'Format tidak valid.' }, { status: 400, headers: noStoreHeaders() });
  if (!sourcePath) return NextResponse.json({ error: 'Source video tidak valid.' }, { status: 400, headers: noStoreHeaders() });
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start || end - start < MIN_CLIP_SECONDS || end - start > MAX_CLIP_SECONDS) {
    return NextResponse.json({ error: 'Durasi clip tidak valid. Pilih minimal 0,1 detik dan maksimal 10 menit.' }, { status: 400, headers: noStoreHeaders() });
  }

  const { data: project, error: projectError } = await supabase.from('projects').insert({
    user_id: user.id,
    name,
    original_filename: typeof body.original_filename === 'string' ? body.original_filename.slice(0, 255) : null,
    start_seconds: start,
    end_seconds: end,
    format,
    source_path: sourcePath,
    status: 'queued',
  }).select('id').single();

  if (projectError || !project) return NextResponse.json({ error: 'Gagal membuat project.' }, { status: 500, headers: noStoreHeaders() });

  const admin = createAdminClient();
  const { data: balance, error: creditError } = await admin.rpc('reserve_clippnow_credit', { p_user_id: user.id, p_reference: project.id });
  if (creditError) {
    await supabase.from('projects').delete().eq('id', project.id);
    const message = creditError.message.includes('insufficient_credits') ? 'Kredit kamu habis. Beli paket untuk melanjutkan.' : 'Gagal menggunakan kredit.';
    return NextResponse.json({ error: message }, { status: creditError.message.includes('insufficient_credits') ? 402 : 500, headers: noStoreHeaders() });
  }

  return NextResponse.json({ project_id: project.id, credits_remaining: balance }, { headers: noStoreHeaders() });
}
