import { describe, expect, it } from 'vitest';
import { formatCreditBalance } from './credit-display';

describe('formatCreditBalance', () => {
  it('shows unlimited credits for the owner without exposing an email identity', () => {
    expect(formatCreditBalance(1, 'owner')).toBe('∞');
  });

  it('shows the numeric balance for regular plans', () => {
    expect(formatCreditBalance(7, 'creator')).toBe('7');
  });
});
