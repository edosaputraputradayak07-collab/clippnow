import { describe, expect, it } from 'vitest';
import { buildAssSubtitles } from '../../lib/ai/ass-subtitles';

describe('buildAssSubtitles', () => {
  it('creates timed karaoke cues in the viral style', () => {
    const ass = buildAssSubtitles([
      { start: 0, end: 0.4, word: 'Kamu' },
      { start: 0.4, end: 0.9, word: 'harus' },
      { start: 0.9, end: 1.4, word: 'lihat' },
    ]);

    expect(ass).toContain('[Events]');
    expect(ass).toContain('Style: Viral');
    expect(ass).toContain('\\k40');
    expect(ass).toContain('Kamu');
  });
});
