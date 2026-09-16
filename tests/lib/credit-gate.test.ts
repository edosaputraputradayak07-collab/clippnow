import { describe, expect, it } from 'vitest';
import { checkCreditGate } from '../../src/lib/credit-gate';

describe('credit gate', () => {
  it('allows processing when available credits cover duration', () => { expect(checkCreditGate({ balance: 5, reserved: 0 }, 180000)).toEqual({ allowed: true, required: 3, available: 5 }); });
  it('blocks processing when credits are insufficient', () => { expect(checkCreditGate({ balance: 2, reserved: 1 }, 120000)).toEqual({ allowed: false, required: 2, available: 1, reason: 'INSUFFICIENT_CREDITS' }); });
});
