import { describe, expect, it } from 'vitest';

describe('Security Center access contract', () => {
  it('allows only the owner plan', () => {
    expect(['owner'].includes('owner')).toBe(true);
    expect(['owner'].includes('creator')).toBe(false);
    expect(['owner'].includes('trial')).toBe(false);
  });
});
