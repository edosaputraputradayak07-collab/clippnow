import { describe, expect, it } from 'vitest';
import { analyzeClipCandidates } from './candidate-analyzer';

const segments = [
  { startSeconds: 0, endSeconds: 4, text: 'Ini rahasia yang jarang orang tahu.' },
  { startSeconds: 4, endSeconds: 10, text: 'Saya mencoba ini selama tiga bulan.' },
  { startSeconds: 10, endSeconds: 17, text: 'Hasilnya membuat omzet naik sepuluh kali.' },
  { startSeconds: 17, endSeconds: 22, text: 'Itulah alasan saya tidak kembali ke cara lama.' },
];

describe('analyzeClipCandidates', () => {
  it('returns deterministic, explainable candidates without mutating input', () => {
    const before = JSON.stringify(segments);
    const first = analyzeClipCandidates(segments, { minDurationSeconds: 8, maxDurationSeconds: 45 });
    const second = analyzeClipCandidates(segments, { minDurationSeconds: 8, maxDurationSeconds: 45 });

    expect(first).toEqual(second);
    expect(JSON.stringify(segments)).toBe(before);
    expect(first[0].score).toBeGreaterThanOrEqual(0);
    expect(first[0].score).toBeLessThanOrEqual(1);
    expect(first[0].reasonLabels.length).toBeGreaterThan(0);
    expect(first[0].retention.hasPayoff).toBe(true);
  });

  it('rejects malformed and duplicate windows', () => {
    const result = analyzeClipCandidates([
      { startSeconds: 4, endSeconds: 2, text: 'bad' },
      { startSeconds: 0, endSeconds: 8, text: 'Useful hook and context.' },
      { startSeconds: 0.1, endSeconds: 8.1, text: 'Useful hook and context.' },
    ], { minDurationSeconds: 5, maxDurationSeconds: 30 });
    expect(result).toHaveLength(1);
  });
});
