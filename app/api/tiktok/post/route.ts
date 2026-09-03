import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getFreshTikTokAccessToken, getTikTokAccount } from '@/lib/tiktok/client';
import { createTikTokMediaSignature, getTikTokMediaSigningSecret } from '@/lib/tiktok/media-signature';
import { noStoreHeaders } from '@/lib/security/request';

type Body = { project_id?: string; mode?: 'direct' | 'draft'; caption?: string; privacy_level?: string; disable_comment?: boolean; disable_duet?: boolean; disable_stitch?: boolean; consent?: boolean };

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders() });
  const body = await request.json().catch(() => ({})) as Body;
  if (!body.project_id || !body.mode || !body.consent) return NextResponse.json({ error: 'Pilih tujuan dan setujui pengiriman video terlebih dahulu.' }, { status: 400, headers: noStoreHeaders() });
  const admin = createAdminClient();
  const { data: project, error: projectError } = await supabase.from('projects').select('id,status,output_path,name').eq('id', body.project_id).eq('user_id', user.id).single();
  if (projectError || !project || project.status !== 'completed' || !project.output_path) return NextResponse.json({ error: 'Video belum selesai dirender.' }, { status: 400, headers: noStoreHeaders() });
  const account = await getTikTokAccount(user.id);
  if (!account) return NextResponse.json({ error: 'Hubungkan akun TikTok terlebih dahulu.' }, { status: 400, headers: noStoreHeaders() });

  const scopes = new Set(account.scopes ?? []);
  const requiredScope = body.mode === 'direct' ? 'video.publish' : 'video.upload';
  if (!scopes.has(requiredScope)) return NextResponse.json({ error: `Izin TikTok ${requiredScope} belum tersedia pada akun terhubung.` }, { status: 403, headers: noStoreHeaders() });

  const mediaBase = process.env.TIKTOK_MEDIA_PUBLIC_BASE_URL;
  if (!mediaBase) return NextResponse.json({ error: 'TikTok media URL belum dikonfigurasi. Upload manual tetap tersedia.' }, { status: 503, headers: noStoreHeaders() });
  let mediaSecret: string;
  try { mediaSecret = getTikTokMediaSigningSecret(); } catch { return NextResponse.json({ error: 'TikTok media signing belum dikonfigurasi.' }, { status: 503, headers: noStoreHeaders() }); }
  const expiresAt = Math.floor(Date.now() / 1000) + 300;
  const signature = createTikTokMediaSignature(project.id, expiresAt, mediaSecret);
  const base = mediaBase.endsWith('/') ? mediaBase.slice(0, -1) : mediaBase;
  const mediaUrl = `${base}/api/tiktok/media/${encodeURIComponent(project.id)}?expires=${expiresAt}&sig=${signature}`;

  const accessToken = await getFreshTikTokAccessToken(account);
  const creatorResponse = body.mode === 'direct' ? await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: '{}', cache: 'no-store' }) : null;
  const creator = creatorResponse ? await creatorResponse.json() as { data?: { privacy_level_options?: string[]; max_video_post_duration_sec?: number }; error?: { code?: string; message?: string } } : null;
  if (creatorResponse && (!creatorResponse.ok || creator?.error?.code !== 'ok')) return NextResponse.json({ error: creator?.error?.message ?? 'Tidak dapat membaca pengaturan creator TikTok.' }, { status: creatorResponse.status || 502, headers: noStoreHeaders() });
  const privacyOptions = creator?.data?.privacy_level_options ?? [];
  const privacy = body.privacy_level ?? privacyOptions[0];
  if (body.mode === 'direct' && (!privacy || !privacyOptions.includes(privacy))) return NextResponse.json({ error: 'Pilihan privacy TikTok tidak valid.' }, { status: 400, headers: noStoreHeaders() });

  const endpoint = body.mode === 'direct' ? 'https://open.tiktokapis.com/v2/post/publish/video/init/' : 'https://open.tiktokapis.com/v2/post/publish/inbox/video/init/';
  const payload = body.mode === 'direct' ? { post_info: { title: (body.caption ?? '').slice(0, 2200), privacy_level: privacy, disable_comment: Boolean(body.disable_comment), disable_duet: Boolean(body.disable_duet), disable_stitch: Boolean(body.disable_stitch) }, source_info: { source: 'PULL_FROM_URL', video_url: mediaUrl } } : { post_info: { title: (body.caption ?? '').slice(0, 2200) }, source_info: { source: 'PULL_FROM_URL', video_url: mediaUrl } };
  const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), cache: 'no-store' });
  const result = await response.json() as { data?: { publish_id?: string }; error?: { code?: string; message?: string } };
  if (!response.ok || result?.error?.code !== 'ok' || !result.data?.publish_id) return NextResponse.json({ error: result?.error?.message ?? 'TikTok menolak upload.' }, { status: response.status || 502, headers: noStoreHeaders() });
  const { error: insertError } = await admin.from('tiktok_posts').insert({ user_id: user.id, project_id: project.id, tiktok_account_id: account.id, mode: body.mode, publish_id: result.data.publish_id, caption: body.caption ?? null, status: body.mode === 'direct' ? 'processing' : 'initialized' });
  if (insertError) return NextResponse.json({ error: 'Video terkirim ke TikTok, tetapi riwayat lokal gagal disimpan.' }, { status: 500, headers: noStoreHeaders() });
  return NextResponse.json({ ok: true, mode: body.mode, publish_id: result.data.publish_id }, { headers: noStoreHeaders() });
}
