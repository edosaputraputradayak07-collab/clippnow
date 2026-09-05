import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBearerToken, getMobileUser } from '@/lib/auth/mobile-request';
import { logSecurityEvent, getClientIp, securityGuard } from '@/lib/security/defense';
import { noStoreHeaders, sameOrigin } from '@/lib/security/request';
import { isYouTubeUrl } from '@/lib/youtube-url';
import { createVizardYouTubeProject, queryVizardProject } from '@/lib/vizard';

async function getUser(request: Request) {
  const isMobile = Boolean(getBearerToken(request));
  if (!isMobile && !sameOrigin(request)) return null;
  const mobileUser = isMobile ? await getMobileUser(request) : null;
  const supabase = mobileUser?.client ?? await createClient();
  const user = mobileUser?.user ?? (await supabase.auth.getUser()).data.user;
  return user;
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers) ?? 'unknown';
  if (!(await securityGuard(`youtube-vizard:${ip}`, 6, 60))) {
    await logSecurityEvent({ eventType: 'rate_limit_youtube_vizard', severity: 'warning', request });
    return NextResponse.json({ error: 'Terlalu banyak permintaan YouTube. Coba lagi sebentar.' }, { status: 429, headers: noStoreHeaders() });
  }
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders() });

  const body = await request.json().catch(() => ({}));
  const youtubeUrl = typeof body.youtube_url === 'string' ? body.youtube_url.trim() : '';
  const count = typeof body.count === 'number' ? Math.min(10, Math.max(1, Math.floor(body.count))) : 5;
  if (!isYouTubeUrl(youtubeUrl)) return NextResponse.json({ error: 'Link YouTube tidak valid.' }, { status: 400, headers: noStoreHeaders() });

  try {
    const result = await createVizardYouTubeProject({ youtubeUrl, clipCount: count, language: typeof body.language === 'string' ? body.language : 'id', projectName: typeof body.project_name === 'string' ? body.project_name : undefined, keywords: typeof body.keywords === 'string' ? body.keywords : undefined });
    if (result.code !== 2000 || !result.projectId) {
      return NextResponse.json({ error: result.errMsg || `Vizard menolak request (code ${result.code}).` }, { status: 502, headers: noStoreHeaders() });
    }
    return NextResponse.json({ provider: 'vizard', provider_project_id: String(result.projectId), share_link: result.shareLink ?? null, status: 'processing' }, { headers: noStoreHeaders() });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Gagal memulai import YouTube.';
    return NextResponse.json({ error: message }, { status: 502, headers: noStoreHeaders() });
  }
}

export async function GET(request: Request) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders() });
  const projectId = new URL(request.url).searchParams.get('project_id');
  if (!projectId || !/^\d+$/.test(projectId)) return NextResponse.json({ error: 'project_id tidak valid.' }, { status: 400, headers: noStoreHeaders() });

  try {
    const result = await queryVizardProject(projectId);
    if (result.code === 1000) return NextResponse.json({ provider: 'vizard', status: 'processing', project_id: projectId, videos: [] }, { headers: noStoreHeaders() });
    if (result.code !== 2000) return NextResponse.json({ error: `Vizard gagal memproses project (code ${result.code}).` }, { status: 502, headers: noStoreHeaders() });
    return NextResponse.json({ provider: 'vizard', status: 'complete', project_id: projectId, project_name: result.projectName ?? null, share_link: result.shareLink ?? null, videos: result.videos ?? [] }, { headers: noStoreHeaders() });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Gagal mengambil hasil YouTube.';
    return NextResponse.json({ error: message }, { status: 502, headers: noStoreHeaders() });
  }
}
