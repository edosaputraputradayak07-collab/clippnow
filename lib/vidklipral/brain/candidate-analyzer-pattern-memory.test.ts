import { describe, expect, it } from 'vitest';
import { analyzeClipCandidates } from './candidate-analyzer';
import { createPatternMemory, learnFromFeedback } from './pattern-memory';

describe('candidate analyzer Pattern Memory integration', () => {
  it('lets positive learned preferences adjust ranking while keeping scores bounded', () => {
    const memory = learnFromFeedback(createPatternMemory(), {
      outcome: 'selected',
      signals: { hook: 1, pacing: 1 },
    });
    const result = analyzeClipCandidates([
      { startSeconds: 0, endSeconds: 4, text: 'Ini rahasia yang jarang orang tahu.' },
      { startSeconds: 4, endSeconds: 10, text: 'Saya mencoba ini selama tiga bulan.' },
      { startSeconds: 10, endSeconds: 17, text: 'Hasilnya membuat omzet naik sepuluh kali.' },
      { startSeconds: 17, endSeconds: 22, text: 'Itulah alasan saya tidak kembali ke cara lama.' },
    ], {
      minDurationSeconds: 8,
      maxDurationSeconds: 45,
      patternMemory: memory,
    });

    expect(result.every((candidate) => candidate.score >= 0 && candidate.score <= 1)).toBe(true);
  });
});
