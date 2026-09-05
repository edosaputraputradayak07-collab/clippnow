import { describe, expect, it } from 'vitest';
import { parseYouTubeDuration, toYouTubeMetadata } from './youtube-metadata';

describe('parseYouTubeDuration', () => {
  it('parses ISO 8601 durations into seconds', () => {
    expect(parseYouTubeDuration('PT1H2M3S')).toBe(3723);
    expect(parseYouTubeDuration('PT4M12S')).toBe(252);
    expect(parseYouTubeDuration('PT9S')).toBe(9);
  });
});

describe('toYouTubeMetadata', () => {
  it('normalizes the official API response for the studio UI', () => {
    expect(toYouTubeMetadata({
      id: 'abc12345678',
      snippet: { title: 'Test video', channelTitle: 'Test Channel', thumbnails: { high: { url: 'https://img.test/high.jpg' } } },
      contentDetails: { duration: 'PT2M5S' },
      status: { embeddable: true, license: 'youtube' },
    })).toEqual({
      videoId: 'abc12345678',
      title: 'Test video',
      channelTitle: 'Test Channel',
      thumbnailUrl: 'https://img.test/high.jpg',
      durationSeconds: 125,
      embeddable: true,
      license: 'youtube',
    });
  });
});
