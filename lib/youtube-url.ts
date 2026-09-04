const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be', 'www.youtu.be']);

export function getYouTubeVideoId(value: string): string | null {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase();
    if (!YOUTUBE_HOSTS.has(host)) return null;

    if (host === 'youtu.be' || host === 'www.youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (url.pathname === '/watch') {
      const id = url.searchParams.get('v');
      return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }

    const parts = url.pathname.split('/').filter(Boolean);
    const marker = parts[0];
    if (['shorts', 'embed', 'live'].includes(marker)) {
      const id = parts[1];
      return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }

    return null;
  } catch {
    return null;
  }
}

export function isYouTubeUrl(value: string): boolean {
  return getYouTubeVideoId(value) !== null;
}

export function getYouTubeEmbedUrl(value: string): string | null {
  const id = getYouTubeVideoId(value);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}
