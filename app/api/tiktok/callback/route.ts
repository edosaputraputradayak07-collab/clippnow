import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { encryptTikTokToken, getTikTokTokenKey } from '@/lib/tiktok/secure-token';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  if (error) return NextResponse.redirect(new URL('/dashboard? tiktok=denied'.replace(' ', ''), request.url));

  const store = await cookies();
  const expectedState = store.get('clippnow_tiktok_oauth_state')?.value;
  store.delete('clippnow_tiktok_oauth_state');
  if (!code || !state || !expectedState || !cryptoSafeEqual(state, expectedState)) return NextResponse.json({ error: 'TikTok OAuth state tidak valid.' }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;
  if (!clientKey || !clientSecret || !redirectUri) return NextResponse.json({ error: 'TikTok belum dikonfigurasi.' }, { status: 503 });

  const body = new URLSearchParams({ client_key: clientKey, client_secret: clientSecret, code, grant_type: 'authorization_code', redirect_uri: redirectUri });
  const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cache-Control': 'no-cache' }, body, cache: 'no-store' });
  const token = await tokenResponse.json() as { access_token?: string; refresh_token?: string; open_id?: string; expires_in?: number; refresh_expires_in?: number; scope?: string; error?: string; error_description?: string };
  if (!tokenResponse.ok || !token.access_token || !token.refresh_token || !token.open_id) return NextResponse.json({ error: token.error_description ?? 'Gagal menghubungkan TikTok.' }, { status: 502 });

  const profileResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,avatar_url,display_name', { headers: { Authorization: `Bearer ${token.access_token}` }, cache: 'no-store' });
  const profile = await profileResponse.json() as { data?: { user?: { open_id?: string; avatar_url?: string; display_name?: string } } };
  const tiktokUser = profile.data?.user;
  const admin = createAdminClient();
  const { error: saveError } = await admin.from('tiktok_accounts').upsert({ user_id: user.id, open_id: token.open_id, display_name: tiktokUser?.display_name ?? null, avatar_url: tiktokUser?.avatar_url ?? null, access_token_enc: encryptTikTokToken(token.access_token, getTikTokTokenKey()), refresh_token_enc: encryptTikTokToken(token.refresh_token, getTikTokTokenKey()), access_token_expires_at: new Date(Date.now() + (token.expires_in ?? 86400) * 1000).toISOString(), refresh_token_expires_at: new Date(Date.now() + (token.refresh_expires_in ?? 31536000) * 1000).toISOString(), scopes: (token.scope ?? '').split(',').map((s) => s.trim()).filter(Boolean), updated_at: new Date().toISOString() }, { onConflict: 'user_id,open_id' });
  if (saveError) return NextResponse.json({ error: 'Gagal menyimpan koneksi TikTok.' }, { status: 500 });
  return NextResponse.redirect(new URL('/dashboard?tiktok=connected', request.url));
}

function cryptoSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  const aa = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  let result = 0;
  for (let i = 0; i < aa.length; i++) result |= aa[i] ^ bb[i];
  return result === 0;
}
