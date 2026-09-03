import { describe, expect, it } from 'vitest';
import { buildViralEditPlan } from './viral-edit-plan';

describe('buildViralEditPlan', () => {
  it('selects a stronger mid-video hook instead of blindly taking the first segment', () => {
    const plan = buildViralEditPlan({
      durationSeconds: 60,
      format: '9:16',
      goal: 'tiktok',
      transcript: [
        { start: 0, end: 3, text: 'Selamat datang di video ini dan terima kasih sudah menonton.' },
        { start: 18, end: 23, text: 'Ini rahasia yang bikin hasilnya berubah 10 kali lebih cepat! Jangan lakukan kesalahan ini.' },
        { start: 25, end: 32, text: 'Langkah berikutnya sangat sederhana dan bisa langsung kamu coba hari ini.' },
      ],
    });

    expect(plan.score).toBeGreaterThan(70);
    expect(plan.clip.startSeconds).toBe(18);
    expect(plan.clip.endSeconds).toBeGreaterThan(30);
    expect(plan.hook.startSeconds).toBe(18);
  });

  it('returns a safe fallback when transcript is empty', () => {
    const plan = buildViralEditPlan({ durationSeconds: 20, format: '1:1', goal: 'education', transcript: [] });
    expect(plan.score).toBe(0);
    expect(plan.clip).toEqual({ startSeconds: 0, endSeconds: 20 });
  });
});
