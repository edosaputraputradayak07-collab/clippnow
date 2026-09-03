import { describe, expect, it } from 'vitest';
import { getDashboardGreeting } from './dashboard-greeting';

describe('getDashboardGreeting', () => {
  it('uses the profile name and never falls back to an email address', () => {
    expect(getDashboardGreeting('Creator One', 'private@example.com')).toBe('Creator One');
    expect(getDashboardGreeting(null, 'private@example.com')).toBe('Creator');
  });
});
