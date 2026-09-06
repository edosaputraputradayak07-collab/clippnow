import { getYouTubeVideoId } from '../../youtube-url';

export type YouTubeProjectRequest = {
  url: string;
  name: string;
};

export function buildYouTubeProjectRequest(input: {
  url: string;
  name?: string;
}): YouTubeProjectRequest {
  const url = input.url.trim();
  if (!getYouTubeVideoId(url)) {
    throw new Error('Unsupported video source');
  }

  const name = typeof input.name === 'string' && input.name.trim()
    ? input.name.trim().slice(0, 120)
    : 'YouTube source';

  return { url, name };
}
