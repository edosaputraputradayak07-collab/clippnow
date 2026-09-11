import { NextResponse } from 'next/server';
import { toSupabaseUserInfo } from '@/lib/auth/tiktok-user';

export async function GET(request: Request) {
  const authorization = request.headers.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const response = await fetch(
    'https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url',
    {
      headers: { Authorization: authorization },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    return NextResponse.json({ error: 'TikTok userinfo request failed' }, { status: response.status });
  }

  const payload = await response.json();

  try {
    return NextResponse.json(toSupabaseUserInfo(payload), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'TikTok user id missing' }, { status: 502 });
  }
}
