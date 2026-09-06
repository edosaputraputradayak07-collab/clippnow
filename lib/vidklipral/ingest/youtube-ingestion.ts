import path from 'node:path';
import { getYouTubeVideoId } from '@/lib/youtube-url';

export type YouTubeIngestionRequest = {
  url: string;
  outputPath: string;
  videoId: string;
};

export function validateYouTubeIngestionRequest(input: {
  url: string;
  outputPath: string;
}): YouTubeIngestionRequest {
  const videoId = getYouTubeVideoId(input.url);
  if (!videoId) throw new Error('Unsupported video source');

  const outputPath = path.resolve(input.outputPath);
  if (path.basename(outputPath) !== path.basename(input.outputPath) || input.outputPath.includes('..')) {
    throw new Error('Unsafe output path');
  }

  if (!outputPath.endsWith('.mp4')) {
    throw new Error('Unsafe output path');
  }

  return {
    url: input.url.trim(),
    outputPath,
    videoId,
  };
}

export function buildYouTubeIngestionArgs(input: YouTubeIngestionRequest): string[] {
  return [
    '--no-playlist',
    '--no-progress',
    '--restrict-filenames',
    '-f',
    'bv*+ba/b',
    '--merge-output-format',
    'mp4',
    '-o',
    input.outputPath,
    input.url,
  ];
}
