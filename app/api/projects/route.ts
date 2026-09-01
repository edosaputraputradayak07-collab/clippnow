import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 120) : 'Untitled clip';
  const format = body.format;
  const sourcePath = typeof body.source_path === 'string' && body.source_path.startsWith(`${user.id}/`) ? body.source_path : null;
  if (!['9:16', '1:1', '16:9'].includes(format)) return NextResponse.json({ error: 'Format tidak valid.' }, { status: 400 });
  if (!sourcePath) return NextResponse.json({ error: 'Source video tidak valid.' }, { status: 400 });

  const { data: project, error: projectError } = await supabase.from('projects').insert({
    user_id: user.id,
    name,
    original_filename: typeof body.original_filename === 'string' ? body.original_filename.slice(0, 255) : null,
    start_seconds: Math.max(0, Number(body.start_seconds) || 0),
    end_seconds: Number.isFinite(Number(body.end_seconds)) ? Math.max(0, Number(body.end_seconds)) : null,
    format,
    source_path: sourcePath,
    status: 'queued',
  }).select('id').single();

  if (projectError || !project) return NextResponse.json({ error: 'Gagal membuat project.' }, { status: 500 });

  const admin = createAdminClient();
  const { data: balance, error: creditError } = await admin.rpc('reserve_clippnow_credit', { p_user_id: user.id, p_reference: project.id });
  if (creditError) {
    await supabase.from('projects').delete().eq('id', project.id);
    const message = creditError.message.includes('insufficient_credits') ? 'Kredit kamu habis. Beli paket untuk melanjutkan.' : 'Gagal menggunakan kredit.';
    return NextResponse.json({ error: message }, { status: creditError.message.includes('insufficient_credits') ? 402 : 500 });
  }

  return NextResponse.json({ project_id: project.id, credits_remaining: balance });
}
