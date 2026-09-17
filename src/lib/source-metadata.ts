const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);

export function extractYouTubeVideoId(value: string): string | null {
  try {
    const url = new URL(value);
    if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null;

    if (url.hostname.toLowerCase() === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }

    const id = url.searchParams.get('v');
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function parseIso8601Duration(value: string): number | null {
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(value);
  if (!match) return null;
  const days = Number(match[1] ?? 0);
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  const seconds = Number(match[4] ?? 0);
  const milliseconds = Math.round((((days * 24 + hours) * 60 + minutes) * 60 + seconds) * 1000);
  return Number.isFinite(milliseconds) && milliseconds > 0 ? milliseconds : null;
}

export async function fetchYouTubeDuration(sourceUrl: string, apiKey: string): Promise<number> {
  const videoId = extractYouTubeVideoId(sourceUrl);
  if (!videoId) throw new Error('INVALID_YOUTUBE_URL');

  const endpoint = new URL('https://www.googleapis.com/youtube/v3/videos');
  endpoint.searchParams.set('part', 'contentDetails');
  endpoint.searchParams.set('id', videoId);
  endpoint.searchParams.set('key', apiKey);

  const response = await fetch(endpoint, { cache: 'no-store' });
  if (!response.ok) throw new Error(`YOUTUBE_METADATA_FAILED:${response.status}`);
  const body = await response.json() as { items?: Array<{ contentDetails?: { duration?: string } }> };
  const duration = body.items?.[0]?.contentDetails?.duration;
  const durationMs = duration ? parseIso8601Duration(duration) : null;
  if (!durationMs) throw new Error('YOUTUBE_DURATION_UNAVAILABLE');
  return durationMs;
}
