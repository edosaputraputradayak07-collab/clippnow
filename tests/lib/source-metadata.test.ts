import { describe, expect, it } from 'vitest';
import { extractYouTubeVideoId, parseIso8601Duration } from '../../src/lib/source-metadata';

describe('source metadata helpers', () => {
  it('extracts supported YouTube video ids', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ?t=12')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeVideoId('https://example.com/watch?v=dQw4w9WgXcQ')).toBeNull();
  });

  it('parses YouTube ISO 8601 durations into milliseconds', () => {
    expect(parseIso8601Duration('PT1H2M3.5S')).toBe(3723500);
    expect(parseIso8601Duration('PT45S')).toBe(45000);
    expect(parseIso8601Duration('P1D')).toBe(86400000);
    expect(parseIso8601Duration('invalid')).toBeNull();
  });
});
