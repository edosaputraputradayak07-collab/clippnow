import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBearerToken, getMobileUser } from '@/lib/auth/mobile-request';
import { logSecurityEvent, getClientIp, securityGuard } from '@/lib/security/defense';
import { noStoreHeaders, sameOrigin } from '@/lib/security/request';
import { isYouTubeUrl } from '@/lib/youtube-url';
import { createLumiClipYouTubeProject, normalizeLumiClipProject, queryLumiClipProject } from '@/lib/lumiclip';

async function getUser(request: Request) {
  const isMobile = Boolean(getBearerToken(request));
  if (!isMobile && !sameOrigin(request)) return null;
  const mobileUser = isMobile ? await getMobileUser(request) : null;
  const supabase = mobileUser?.client ?? await createClient();
  return mobileUser?.user ?? (await supabase.auth.getUser()).data.user;
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers) ?? 'unknown';
  if (!(await securityGuard(`youtube-lumiclip:${ip}`, 6, 60))) {
    await logSecurityEvent({ eventType: 'rate_limit_youtube_lumiclip', severity: 'warning', request });
    return NextResponse.json({ error: 'Terlalu banyak permintaan YouTube. Coba lagi sebentar.' }, { status: 429, headers: noStoreHeaders() });
  }
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders() });

  const body = await request.json().catch(() => ({}));
  const youtubeUrl = typeof body.youtube_url === 'string' ? body.youtube_url.trim() : '';
  if (!isYouTubeUrl(youtubeUrl)) return NextResponse.json({ error: 'Link YouTube tidak valid.' }, { status: 400, headers: noStoreHeaders() });

  try {
    const result = await createLumiClipYouTubeProject({ youtubeUrl });
    if (!result.project_id) return NextResponse.json({ error: result.message || 'LumiClip tidak mengembalikan project_id.' }, { status: 502, headers: noStoreHeaders() });
    return NextResponse.json({ provider: 'lumiclip', provider_project_id: result.project_id, status: 'processing', estimated_minutes: result.estimated_minutes ?? null }, { headers: noStoreHeaders() });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Gagal memulai import YouTube.';
    return NextResponse.json({ error: message }, { status: 502, headers: noStoreHeaders() });
  }
}

export async function GET(request: Request) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders() });
  const projectId = new URL(request.url).searchParams.get('project_id');
  if (!projectId || !/^[A-Za-z0-9_-]+$/.test(projectId)) return NextResponse.json({ error: 'project_id tidak valid.' }, { status: 400, headers: noStoreHeaders() });

  try {
    const result = normalizeLumiClipProject(await queryLumiClipProject(projectId));
    return NextResponse.json({ provider: 'lumiclip', ...result }, { headers: noStoreHeaders() });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Gagal mengambil hasil YouTube.';
    return NextResponse.json({ error: message }, { status: 502, headers: noStoreHeaders() });
  }
}
