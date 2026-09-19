import { describe, expect, it } from 'vitest';
import { availableCredits, consumeReservedCredits, creditsForDuration, releaseReservedCredits, reserveCredits } from '../../src/lib/credits';

describe('credits', () => {
  it('charges one credit per started minute', () => { expect(creditsForDuration(1)).toBe(1); expect(creditsForDuration(60000)).toBe(1); expect(creditsForDuration(60001)).toBe(2); });
  it('reserves only available credits', () => { const next = reserveCredits({ balance: 5, reserved: 1 }, 3); expect(next).toEqual({ balance: 5, reserved: 4 }); expect(availableCredits(next)).toBe(1); });
  it('consumes and releases reservations atomically at domain level', () => { expect(consumeReservedCredits({ balance: 5, reserved: 3 }, 2)).toEqual({ balance: 3, reserved: 1 }); expect(releaseReservedCredits({ balance: 5, reserved: 3 }, 2)).toEqual({ balance: 5, reserved: 1 }); });
  it('rejects insufficient or malformed amounts', () => { expect(() => reserveCredits({ balance: 1, reserved: 1 }, 1)).toThrow('INSUFFICIENT_CREDITS'); expect(() => creditsForDuration(-1)).toThrow('DURATION_INVALID'); });
});
