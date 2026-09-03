import { describe, expect, it } from 'vitest';
import { landingExperience, authExperience, dashboardExperience } from '@/lib/ui/marketing-experience';

describe('ClippNow marketing experience', () => {
  it('uses the automatic viral workflow in public messaging', () => {
    expect(landingExperience.workflow).toEqual(['Upload', 'AI pilih momen', 'Render', 'Publish']);
    expect(landingExperience.hero).toContain('AI');
  });

  it('defines visual promo surfaces for landing and auth', () => {
    expect(landingExperience.visualLabel).toBeTruthy();
    expect(authExperience.visualLabel).toBeTruthy();
  });

  it('keeps dashboard promo focused on the one-tap creator flow', () => {
    expect(dashboardExperience.cta).toContain('AI');
    expect(dashboardExperience.features).toContain('Subtitle otomatis');
  });
});
