import { describe, expect, it } from 'vitest';
import { classifyRetentionShape, type TranscriptSegment } from './retention';

const segments: TranscriptSegment[] = [
  { startSeconds: 0, endSeconds: 3, text: 'Kamu tidak akan percaya apa yang terjadi.' },
  { startSeconds: 3, endSeconds: 8, text: 'Saya membuka bisnis ini dengan modal kecil.' },
  { startSeconds: 8, endSeconds: 15, text: 'Lalu dalam tiga bulan omzetnya naik sepuluh kali.' },
  { startSeconds: 15, endSeconds: 20, text: 'Itu yang akhirnya mengubah cara saya bekerja.' },
];

describe('classifyRetentionShape', () => {
  it('recognizes a hook, context, escalation and payoff sequence', () => {
    const result = classifyRetentionShape(segments);
    expect(result.hasHook).toBe(true);
    expect(result.hasContext).toBe(true);
    expect(result.hasEscalation).toBe(true);
    expect(result.hasPayoff).toBe(true);
  });

  it('returns a stable shape for malformed timing instead of throwing', () => {
    const result = classifyRetentionShape([
      { startSeconds: 4, endSeconds: 2, text: 'bad' },
      { startSeconds: Number.NaN, endSeconds: 3, text: 'also bad' },
    ]);
    expect(result.hasHook).toBe(false);
    expect(result.hasPayoff).toBe(false);
  });
});
