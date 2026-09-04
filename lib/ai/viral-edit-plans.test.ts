import { describe, expect, it } from 'vitest';
import { buildViralEditPlans } from './viral-edit-plan';

describe('buildViralEditPlans', () => {
  const transcript = Array.from({ length: 24 }, (_, index) => ({
    start: index * 12,
    end: index * 12 + 8,
    text: index % 2 === 0 ? `Ternyata ini rahasia penting bagian ${index}` : `Kenapa hal ini bisa terjadi bagian ${index}?`,
  }));

  it('returns multiple ranked clips up to the requested count', () => {
    const plans = buildViralEditPlans({ durationSeconds: 300, format: '9:16', goal: 'tiktok', transcript, count: 7 });
    expect(plans).toHaveLength(7);
    expect(plans.every(plan => plan.score >= 0 && plan.score <= 100)).toBe(true);
  });

  it('never returns more than ten clips and avoids overlapping ranges', () => {
    const plans = buildViralEditPlans({ durationSeconds: 300, format: '9:16', goal: 'tiktok', transcript, count: 20 });
    expect(plans).toHaveLength(10);
    const sorted = [...plans].sort((a, b) => a.clip.startSeconds - b.clip.startSeconds);
    for (let i = 1; i < sorted.length; i += 1) {
      expect(sorted[i].clip.startSeconds).toBeGreaterThanOrEqual(sorted[i - 1].clip.endSeconds);
    }
  });
});
