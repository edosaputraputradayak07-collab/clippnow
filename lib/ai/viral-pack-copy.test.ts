import { describe, expect, it } from 'vitest';
import { formatViralPackCopy } from './viral-pack-copy';

describe('formatViralPackCopy', () => {
  it('combines the selected title, caption and hashtags into one posting-ready block', () => {
    expect(formatViralPackCopy({
      title: 'Judul menarik',
      caption: 'Caption siap posting.',
      hashtags: ['#fyp', '#tips'],
    })).toBe('Judul menarik\n\nCaption siap posting.\n\n#fyp #tips');
  });
});
