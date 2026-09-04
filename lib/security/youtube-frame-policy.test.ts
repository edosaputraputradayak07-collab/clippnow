import { describe, expect, it } from 'vitest';
import { YOUTUBE_FRAME_SOURCES } from './youtube-frame-policy';

describe('YouTube frame CSP policy', () => {
  it('allows the YouTube embed host used by the preview player', () => {
    expect(YOUTUBE_FRAME_SOURCES).toContain('https://www.youtube-nocookie.com');
  });

  it('also allows the regular YouTube embed host for compatibility', () => {
    expect(YOUTUBE_FRAME_SOURCES).toContain('https://www.youtube.com');
  });
});
