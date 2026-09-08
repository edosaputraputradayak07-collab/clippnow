import { describe, expect, it } from 'vitest';
import { parseMediaDuration } from './media-duration';

describe('parseMediaDuration', () => {
  it('parses an ffmpeg Duration line into seconds', () => {
    expect(parseMediaDuration('Duration: 00:12:34.56, start: 0.000000, bitrate: 1000 kb/s')).toBe(754.56);
  });

  it('rejects output without a valid duration', () => {
    expect(() => parseMediaDuration('no duration here')).toThrow('Media duration unavailable');
  });
});
