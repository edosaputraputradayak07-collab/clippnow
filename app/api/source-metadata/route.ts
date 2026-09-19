import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../src/lib/auth';
import { fetchYouTubeDuration, parseYouTubeVideoId } from '../../../src/lib/youtube';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || typeof (body as Record<string, unknown>).sourceType !== 'string') {
    return NextResponse.json({ error: 'INVALID_SOURCE_METADATA_REQUEST' }, { status: 400 });
  }

  const sourceType = (body as Record<string, unknown>).sourceType;
  if (sourceType === 'upload') {
    return NextResponse.json({ error: 'UPLOAD_DURATION_MUST_BE_READ_BY_CLIENT' }, { status: 400 });
  }

  if (sourceType !== 'youtube' || typeof (body as Record<string, unknown>).sourceUrl !== 'string') {
    return NextResponse.json({ error: 'UNSUPPORTED_SOURCE_TYPE' }, { status: 400 });
  }

  const sourceUrl = (body as Record<string, unknown>).sourceUrl.trim();
  if (!parseYouTubeVideoId(sourceUrl)) return NextResponse.json({ error: 'YOUTUBE_URL_INVALID' }, { status: 400 });
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'YOUTUBE_API_NOT_CONFIGURED' }, { status: 503 });

  try {
    const durationMs = await fetchYouTubeDuration(sourceUrl, apiKey);
    return NextResponse.json({ durationMs }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'YOUTUBE_METADATA_FAILED';
    return NextResponse.json({ error: message }, { status: message === 'YOUTUBE_DURATION_UNAVAILABLE' ? 422 : 502 });
  }
}
