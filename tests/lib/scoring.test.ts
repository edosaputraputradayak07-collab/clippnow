import { describe, expect, it } from 'vitest';
import { CONTENT_MODES } from '../../src/lib/types/core';
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

  it('gives every required mode a positive relevance signal for its vocabulary', () => {
    const fixtures = {
      affiliate: 'Beli sekarang, cek link untuk harga promo dan coba manfaat produk ini.',
      seller: 'Produk kami berkualitas, pesan di toko dengan harga promo dan garansi.',
      live_seller: 'Tanya jawab sekarang, stok terbatas, checkout dan dapatkan diskon promo.',
      podcast: 'Menurut pengalaman saya, cerita ini memberi insight tentang pendapat dan kenapa hal itu terjadi.',
      educator: 'Ini cara belajar: ikuti langkah, lihat fakta dan contoh, lalu ambil kesimpulan.',
    } as const;

    for (const mode of CONTENT_MODES) {
      const result = scoreSegment(segment(mode, fixtures[mode], 0), mode);
      expect(result.signals.modeRelevance).toBeGreaterThan(0);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
    }
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
