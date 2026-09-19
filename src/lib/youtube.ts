const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);

export function parseYouTubeVideoId(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null;

    let id: string | null = null;
    if (url.hostname.toLowerCase() === 'youtu.be') {
      id = url.pathname.split('/').filter(Boolean)[0] ?? null;
    } else if (url.pathname === '/watch') {
      id = url.searchParams.get('v');
    } else if (url.pathname.startsWith('/embed/')) {
      id = url.pathname.split('/')[2] ?? null;
    } else if (url.pathname.startsWith('/shorts/')) {
      id = url.pathname.split('/')[2] ?? null;
    }

    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function parseYouTubeDuration(value: string): number | null {
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)$/.exec(value);
  if (!match) return null;
  const days = Number(match[1] ?? 0);
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  const seconds = Number(match[4] ?? 0);
  const durationMs = Math.round((((days * 24 + hours) * 60 + minutes) * 60 + seconds) * 1000);
  return durationMs > 0 && Number.isFinite(durationMs) ? durationMs : null;
}

type YouTubeVideoResponse = {
  items?: Array<{ contentDetails?: { duration?: string } }>;
};

export async function fetchYouTubeDuration(
  url: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<number> {
  const videoId = parseYouTubeVideoId(url);
  if (!videoId) throw new Error('YOUTUBE_URL_INVALID');
  if (!apiKey) throw new Error('YOUTUBE_API_NOT_CONFIGURED');

  const endpoint = new URL('https://www.googleapis.com/youtube/v3/videos');
  endpoint.searchParams.set('part', 'contentDetails');
  endpoint.searchParams.set('id', videoId);
  endpoint.searchParams.set('key', apiKey);

  const response = await fetchImpl(endpoint, { cache: 'no-store' });
  if (!response.ok) throw new Error(`YOUTUBE_METADATA_FAILED:${response.status}`);
  const body = await response.json() as YouTubeVideoResponse;
  const duration = body.items?.[0]?.contentDetails?.duration;
  const durationMs = duration ? parseYouTubeDuration(duration) : null;
  if (!durationMs) throw new Error('YOUTUBE_DURATION_UNAVAILABLE');
  return durationMs;
}
