import { describe, expect, it } from 'vitest';
import { buildYouTubeIngestionArgs, validateYouTubeIngestionRequest } from './youtube-ingestion';

describe('native YouTube ingestion contract', () => {
  it('accepts a valid YouTube source and returns a safe yt-dlp command', () => {
    const request = validateYouTubeIngestionRequest({
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      outputPath: '/tmp/source.mp4',
    });

    expect(request.videoId).toBe('dQw4w9WgXcQ');
    expect(buildYouTubeIngestionArgs(request)).toEqual([
      '--no-playlist',
      '--no-progress',
      '--restrict-filenames',
      '-f',
      'bv*+ba/b',
      '--merge-output-format',
      'mp4',
      '-o',
      '/tmp/source.mp4',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    ]);
  });

  it('rejects non-YouTube URLs before any downloader command is built', () => {
    expect(() =>
      validateYouTubeIngestionRequest({
        url: 'https://example.com/video.mp4',
        outputPath: '/tmp/source.mp4',
      }),
    ).toThrow('Unsupported video source');
  });

  it('rejects unsafe output paths', () => {
    expect(() =>
      validateYouTubeIngestionRequest({
        url: 'https://youtu.be/dQw4w9WgXcQ',
        outputPath: '../source.mp4',
      }),
    ).toThrow('Unsafe output path');
  });
});
