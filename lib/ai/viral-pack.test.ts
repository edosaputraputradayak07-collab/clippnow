import { describe, expect, it } from 'vitest';
import { buildViralPack } from './viral-pack';

describe('buildViralPack', () => {
  const input = {
    platform: 'tiktok' as const,
    title: 'Podcast clip',
    transcript: 'Ternyata cara sederhana ini bisa menghemat waktu setiap hari. Jangan lakukan kesalahan ini lagi.',
    score: 94,
  };

  it('creates grounded titles, caption, hashtags, keywords and CTA', () => {
    const pack = buildViralPack(input);
    expect(pack.titles).toHaveLength(3);
    expect(pack.caption.length).toBeGreaterThan(0);
    expect(pack.hashtags.length).toBeGreaterThanOrEqual(5);
    expect(pack.hashtags.length).toBeLessThanOrEqual(10);
    expect(pack.keywords.length).toBeGreaterThanOrEqual(3);
    expect(pack.keywords.length).toBeLessThanOrEqual(8);
    expect(pack.cta.length).toBeGreaterThan(0);
    expect(pack.angle.length).toBeGreaterThan(0);
    expect(pack.caption.toLowerCase()).not.toContain('pasti viral');
  });

  it('supports platform-specific output', () => {
    const youtube = buildViralPack({ ...input, platform: 'youtube-shorts' });
    const instagram = buildViralPack({ ...input, platform: 'instagram-reels' });
    expect(youtube.titles).toHaveLength(3);
    expect(instagram.titles).toHaveLength(3);
    expect(new Set(youtube.hashtags).size).toBe(youtube.hashtags.length);
  });

  it('does not invent claims when transcript is sparse', () => {
    const pack = buildViralPack({ platform: 'tiktok', title: 'Clip', transcript: 'Halo semuanya.', score: 50 });
    expect(pack.angle).toContain('Halo semuanya');
    expect(pack.hashtags.every(tag => tag.startsWith('#'))).toBe(true);
  });
});
