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

  const admin = createAdminClient();
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

  const { data: profile, error: creditError } = await admin.from('profiles').update({ credits: undefined }).eq('id', user.id).gt('credits', 0).select('credits').single();
  if (creditError || !profile) {
    await supabase.from('projects').delete().eq('id', project.id);
    return NextResponse.json({ error: 'Kredit kamu habis. Beli paket untuk melanjutkan.' }, { status: 402 });
  }

  const { data: current } = await admin.from('profiles').select('credits').eq('id', user.id).single();
  const remaining = Math.max(0, (current?.credits ?? 1) - 1);
  const { error: decrementError } = await admin.from('profiles').update({ credits: remaining, updated_at: new Date().toISOString() }).eq('id', user.id);
  if (decrementError) {
    await supabase.from('projects').delete().eq('id', project.id);
    return NextResponse.json({ error: 'Gagal mengunci kredit.' }, { status: 500 });
  }

  const { error: transactionError } = await admin.from('credit_transactions').insert({ user_id: user.id, amount: -1, type: 'usage', reference_id: project.id, description: 'Clip processing credit' });
  if (transactionError) {
    await admin.from('profiles').update({ credits: remaining + 1, updated_at: new Date().toISOString() }).eq('id', user.id);
    await supabase.from('projects').delete().eq('id', project.id);
    return NextResponse.json({ error: 'Gagal mencatat penggunaan kredit.' }, { status: 500 });
  }

  return NextResponse.json({ project_id: project.id, credits_remaining: remaining });
}
