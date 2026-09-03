import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getFreshTikTokAccessToken, getTikTokAccount } from '@/lib/tiktok/client';
import { noStoreHeaders } from '@/lib/security/request';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders() });
  const account = await getTikTokAccount(user.id);
  if (!account) return NextResponse.json({ error: 'TikTok belum terhubung.' }, { status: 404, headers: noStoreHeaders() });
  const accessToken = await getFreshTikTokAccessToken(account);
  const response = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: '{}', cache: 'no-store' });
  const data = await response.json();
  if (!response.ok || data?.error?.code !== 'ok') return NextResponse.json({ error: data?.error?.message ?? 'Gagal mengambil pengaturan TikTok.' }, { status: response.status || 502, headers: noStoreHeaders() });
  return NextResponse.json({ creator: data.data }, { headers: noStoreHeaders() });
}
