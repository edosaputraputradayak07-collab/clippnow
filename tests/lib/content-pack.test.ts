import { describe, expect, it } from 'vitest';
import { buildContentPack, type ContentPack } from '../../src/lib/content-pack';
import type { ScoredClipCandidate } from '../../src/lib/scoring';

const candidate: ScoredClipCandidate = {
  id: 'seg-1', startMs: 10_000, endMs: 45_000, durationMs: 35_000,
  text: 'Ini cara memilih produk yang bagus. Cek manfaatnya sebelum beli dan jangan lupa bandingkan harga.',
  utteranceIds: ['utt-1'], wordCount: 16, score: 82.4,
  signals: { hook: .9, retention: .9, emotion: .2, clarity: .8, shareability: .5, modeRelevance: .8, cta: .5, novelty: .7 },
};

describe('content pack', () => {
  it('builds a complete Indonesian pack for every mode', () => {
    const modes = ['affiliate', 'seller', 'live_seller', 'podcast', 'educator'] as const;
    for (const mode of modes) {
      const pack: ContentPack = buildContentPack(candidate, mode);
      expect(pack.mode).toBe(mode);
      expect(pack.hook.length).toBeGreaterThan(0);
      expect(pack.title.length).toBeGreaterThan(0);
      expect(pack.caption.length).toBeGreaterThan(0);
      expect(pack.cta.length).toBeGreaterThan(0);
      expect(pack.hashtags.length).toBeGreaterThanOrEqual(3);
      expect(pack.rationale.length).toBeGreaterThan(0);
      expect(pack.angle.length).toBeGreaterThan(0);
    }
  });

  it('keeps mode-specific CTA and hashtag constraints', () => {
    const affiliate = buildContentPack(candidate, 'affiliate');
    const educator = buildContentPack(candidate, 'educator');
    expect(affiliate.cta).toMatch(/cek|beli|coba|klik/i);
    expect(affiliate.hashtags.some((tag) => /affiliate/i.test(tag))).toBe(true);
    expect(educator.cta).toMatch(/simpan|follow|share|komentar/i);
    expect(educator.hashtags.some((tag) => /belajar|edukasi|tips/i.test(tag))).toBe(true);
  });

  it('never returns more than 8 hashtags and normalizes hashtag syntax', () => {
    const pack = buildContentPack(candidate, 'seller');
    expect(pack.hashtags.length).toBeLessThanOrEqual(8);
    expect(pack.hashtags.every((tag) => /^#[a-z0-9_]+$/i.test(tag))).toBe(true);
  });
});
