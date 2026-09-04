import { describe, expect, it } from 'vitest';
import { getYouTubeVideoId, isYouTubeUrl } from './youtube-url';

describe('YouTube URL helpers', () => {
  it('accepts watch URLs and extracts the video id', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    expect(isYouTubeUrl(url)).toBe(true);
    expect(getYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
  });

  it('accepts short youtu.be URLs', () => {
    expect(getYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ?t=42')).toBe('dQw4w9WgXcQ');
  });

  it('rejects non-YouTube URLs', () => {
    expect(isYouTubeUrl('https://example.com/video.mp4')).toBe(false);
    expect(getYouTubeVideoId('https://example.com/video.mp4')).toBeNull();
  });
});
