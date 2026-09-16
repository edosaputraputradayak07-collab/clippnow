import { describe, expect, it } from 'vitest';
import { selectDiverseCandidates, scoreSegment } from '../../src/lib/scoring';
import type { ContentSegment } from '../../src/lib/segmentation';

const segment = (id: string, text: string, startMs: number): ContentSegment => ({
  id,
  startMs,
  endMs: startMs + 30_000,
  text,
  utteranceIds: [id],
  durationMs: 30_000,
  wordCount: text.split(/\s+/).length,
});

describe('Task 9 scoring', () => {
  it('scores a mode-relevant segment with bounded score and signals', () => {
    const result = scoreSegment(segment('a', 'Ini cara beli produk dengan harga promo, klik link dan coba sekarang', 0), 'affiliate');
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.signals.modeRelevance).toBeGreaterThan(0);
    expect(result.signals.cta).toBeGreaterThan(0);
  });

  it('selects ranked candidates while filtering highly overlapping clips', () => {
    const candidates = [
      segment('a', 'Ini cara beli produk dengan harga promo, klik link dan coba sekarang', 0),
      segment('b', 'Ini cara beli produk dengan harga promo, klik link dan coba sekarang', 30_000),
      segment('c', 'Menurut pengalaman saya, ternyata ada tips penting yang banyak orang tidak tahu', 60_000),
    ];
    const selected = selectDiverseCandidates(candidates, 'affiliate', 3, 0.72);
    expect(selected.length).toBe(2);
    expect(new Set(selected.map((item) => item.id)).size).toBe(2);
  });

  it('rejects invalid selection settings', () => {
    expect(() => selectDiverseCandidates([], 'podcast', 0)).toThrow('SELECTION_LIMIT_INVALID');
    expect(() => selectDiverseCandidates([], 'podcast', 5, 2)).toThrow('SELECTION_OVERLAP_INVALID');
  });
});
