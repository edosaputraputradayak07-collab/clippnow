type YouTubeApiVideo = {
  id: string;
  snippet?: {
    title?: string;
    channelTitle?: string;
    thumbnails?: { high?: { url?: string }; medium?: { url?: string }; default?: { url?: string } };
  };
  contentDetails?: { duration?: string };
  status?: { embeddable?: boolean; license?: string };
};

export type YouTubeMetadata = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  embeddable: boolean;
  license: string | null;
};

export function parseYouTubeDuration(value: string): number {
  const match = /^P(?:0D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)$/.exec(value);
  if (!match) return 0;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
}

export function toYouTubeMetadata(video: YouTubeApiVideo): YouTubeMetadata {
  return {
    videoId: video.id,
    title: video.snippet?.title?.trim() || 'Untitled video',
    channelTitle: video.snippet?.channelTitle?.trim() || 'Unknown channel',
    thumbnailUrl: video.snippet?.thumbnails?.high?.url ?? video.snippet?.thumbnails?.medium?.url ?? video.snippet?.thumbnails?.default?.url ?? null,
    durationSeconds: parseYouTubeDuration(video.contentDetails?.duration ?? ''),
    embeddable: video.status?.embeddable !== false,
    license: video.status?.license ?? null,
  };
}
