import { describe, expect, it } from 'vitest';
import { buildYouTubeProjectRequest } from './youtube-project-request';

describe('YouTube project request', () => {
  it('normalizes a valid URL and creates a safe project request', () => {
    expect(buildYouTubeProjectRequest({
      url: ' https://www.youtube.com/watch?v=dQw4w9WgXcQ ',
      name: 'My source',
    })).toEqual({
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      name: 'My source',
    });
  });

  it('rejects non-YouTube URLs before persistence', () => {
    expect(() => buildYouTubeProjectRequest({
      url: 'https://example.com/video.mp4',
      name: 'Bad source',
    })).toThrow('Unsupported video source');
  });

  it('uses a bounded default name when no name is provided', () => {
    expect(buildYouTubeProjectRequest({
      url: 'https://youtu.be/dQw4w9WgXcQ',
    })).toEqual({
      url: 'https://youtu.be/dQw4w9WgXcQ',
      name: 'YouTube source',
    });
  });
});
