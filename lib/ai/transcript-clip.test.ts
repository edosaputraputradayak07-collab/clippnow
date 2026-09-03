import { describe, expect, it } from 'vitest';
import { selectClipWords } from './transcript-clip';

describe('selectClipWords', () => {
  it('keeps selected words and rebases timestamps to the rendered clip', () => {
    const words = [
      { start: 10, end: 11, word: 'sebelum' },
      { start: 12, end: 13, word: 'ini' },
      { start: 15, end: 16, word: 'ternyata' },
      { start: 18, end: 19, word: 'viral' },
      { start: 25, end: 26, word: 'akhir' },
    ];

    expect(selectClipWords(words, 14, 20)).toEqual([
      { start: 1, end: 2, word: 'ternyata' },
      { start: 4, end: 5, word: 'viral' },
    ]);
  });
});
