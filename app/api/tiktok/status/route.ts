import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getFreshTikTokAccessToken, getTikTokAccount } from '@/lib/tiktok/client';
import { noStoreHeaders } from '@/lib/security/request';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders() });
  const body = await request.json().catch(() => ({})) as { publish_id?: string };
  if (!body.publish_id) return NextResponse.json({ error: 'publish_id wajib diisi.' }, { status: 400, headers: noStoreHeaders() });
  const admin = createAdminClient();
  const { data: post } = await admin.from('tiktok_posts').select('id,mode,status').eq('user_id', user.id).eq('publish_id', body.publish_id).maybeSingle();
  if (!post) return NextResponse.json({ error: 'Publikasi tidak ditemukan.' }, { status: 404, headers: noStoreHeaders() });
  const account = await getTikTokAccount(user.id);
  if (!account) return NextResponse.json({ error: 'Akun TikTok tidak terhubung.' }, { status: 400, headers: noStoreHeaders() });
  const accessToken = await getFreshTikTokAccessToken(account);
  const response = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ publish_id: body.publish_id }), cache: 'no-store' });
  const result = await response.json() as { data?: { status?: string; fail_reason?: string }; error?: { code?: string; message?: string } };
  if (!response.ok || result?.error?.code !== 'ok') return NextResponse.json({ error: result?.error?.message ?? 'Gagal membaca status TikTok.' }, { status: response.status || 502, headers: noStoreHeaders() });
  const status = result.data?.status ?? 'PROCESSING';
  const normalized = status === 'PUBLISH_COMPLETE' ? 'completed' : status === 'FAILED' ? 'failed' : post.mode === 'draft' ? 'initialized' : 'processing';
  await admin.from('tiktok_posts').update({ status: normalized, error_message: result.data?.fail_reason ?? null, updated_at: new Date().toISOString() }).eq('id', post.id).eq('user_id', user.id);
  return NextResponse.json({ ok: true, status, fail_reason: result.data?.fail_reason ?? null }, { headers: noStoreHeaders() });
}
