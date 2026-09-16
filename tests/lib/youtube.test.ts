import { describe, expect, it } from 'vitest';
import { parseYouTubeVideoId, parseYouTubeDuration } from '../../src/lib/youtube';

describe('YouTube metadata helpers', () => {
  it('parses supported watch, short, and embed URLs', () => {
    expect(parseYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ?t=12')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('rejects unrelated URLs and malformed video ids', () => {
    expect(parseYouTubeVideoId('https://example.com/video')).toBeNull();
    expect(parseYouTubeVideoId('https://www.youtube.com/watch?v=bad')).toBeNull();
  });

  it('converts ISO 8601 YouTube durations to milliseconds', () => {
    expect(parseYouTubeDuration('PT1H2M3.5S')).toBe(3_723_500);
    expect(parseYouTubeDuration('PT45S')).toBe(45_000);
    expect(parseYouTubeDuration('P1DT2H')).toBe(93_600_000);
  });

  it('rejects invalid or zero durations', () => {
    expect(parseYouTubeDuration('PT0S')).toBeNull();
    expect(parseYouTubeDuration('invalid')).toBeNull();
  });
});
