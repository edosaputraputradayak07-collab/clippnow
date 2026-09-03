import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTikTokMediaSigningSecret, verifyTikTokMediaSignature } from '@/lib/tiktok/media-signature';
import { noStoreHeaders } from '@/lib/security/request';

export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) return NextResponse.json({ error: 'Invalid project.' }, { status: 400, headers: noStoreHeaders() });

  const url = new URL(request.url);
  const expiresAt = Number(url.searchParams.get('expires') ?? '0');
  const signature = url.searchParams.get('sig') ?? '';
  let secret: string;
  try { secret = getTikTokMediaSigningSecret(); } catch { return NextResponse.json({ error: 'Media signing belum dikonfigurasi.' }, { status: 503, headers: noStoreHeaders() }); }
  if (!verifyTikTokMediaSignature(projectId, expiresAt, signature, secret)) return NextResponse.json({ error: 'Invalid or expired media URL.' }, { status: 403, headers: noStoreHeaders() });

  const admin = createAdminClient();
  const { data: project, error } = await admin.from('projects').select('output_path,status').eq('id', projectId).maybeSingle();
  if (error || !project || project.status !== 'completed' || !project.output_path) return NextResponse.json({ error: 'Rendered video tidak ditemukan.' }, { status: 404, headers: noStoreHeaders() });

  const { data, error: signedError } = await admin.storage.from('clippnow-videos').createSignedUrl(project.output_path, Math.max(60, Math.min(600, expiresAt - Math.floor(Date.now() / 1000))));
  if (signedError || !data?.signedUrl) return NextResponse.json({ error: 'Gagal membuat media URL.' }, { status: 502, headers: noStoreHeaders() });
  return NextResponse.redirect(data.signedUrl, { status: 307, headers: { 'Cache-Control': 'no-store' } });
}
