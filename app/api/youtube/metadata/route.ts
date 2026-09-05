import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getYouTubeVideoId } from '@/lib/youtube-url';
import { toYouTubeMetadata } from '@/lib/youtube-metadata';
import { getClientIp, logSecurityEvent, securityGuard } from '@/lib/security/defense';
import { noStoreHeaders, sameOrigin } from '@/lib/security/request';

export async function POST(request: Request) {
  const ip = getClientIp(request.headers) ?? 'unknown';
  if (!(await securityGuard(`youtube-metadata:${ip}`, 30, 60))) {
    await logSecurityEvent({ eventType: 'rate_limit_youtube_metadata', severity: 'warning', request });
    return NextResponse.json({ error: 'Terlalu banyak permintaan. Coba lagi sebentar.' }, { status: 429, headers: noStoreHeaders() });
  }

  if (!sameOrigin(request)) {
    await logSecurityEvent({ eventType: 'invalid_origin_youtube_metadata', severity: 'warning', request });
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403, headers: noStoreHeaders() });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders() });

  const body = await request.json().catch(() => ({}));
  const input = typeof body.url === 'string' ? body.url.trim() : '';
  const videoId = getYouTubeVideoId(input);
  if (!videoId) return NextResponse.json({ error: 'Link YouTube tidak valid.' }, { status: 400, headers: noStoreHeaders() });

  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Metadata YouTube belum dikonfigurasi di server.' }, { status: 503, headers: noStoreHeaders() });

  const endpoint = new URL('https://www.googleapis.com/youtube/v3/videos');
  endpoint.searchParams.set('part', 'snippet,contentDetails,status');
  endpoint.searchParams.set('id', videoId);
  endpoint.searchParams.set('key', apiKey);

  const response = await fetch(endpoint, { method: 'GET', cache: 'no-store' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return NextResponse.json({ error: 'YouTube tidak dapat memberikan metadata video ini.' }, { status: response.status === 404 ? 404 : 502, headers: noStoreHeaders() });
  }

  const video = Array.isArray(payload.items) ? payload.items[0] : null;
  if (!video) return NextResponse.json({ error: 'Video YouTube tidak ditemukan atau tidak tersedia.' }, { status: 404, headers: noStoreHeaders() });

  return NextResponse.json({ metadata: toYouTubeMetadata(video) }, { headers: noStoreHeaders() });
}
