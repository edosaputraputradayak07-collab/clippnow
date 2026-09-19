import { describe, expect, it } from 'vitest';
import { createConfiguredPaymentProvider, verifyHmacSignature } from '../../src/lib/payments';

describe('payments', () => {
  it('verifies webhook signatures without timing leaks', () => { expect(verifyHmacSignature('hello', 'bad', 'secret')).toBe(false); });
  it('keeps payment credentials server-side and fails closed when disabled', async () => { const provider = createConfiguredPaymentProvider({ PAYMENT_PROVIDER: 'disabled' }); await expect(provider.createPayment({ userId: 'u', credits: 10, amountIdr: 10000, orderId: 'o', description: 'x' })).rejects.toThrow('PAYMENT_PROVIDER_NOT_CONFIGURED'); });
  it('requires an endpoint for an enabled provider', () => { expect(() => createConfiguredPaymentProvider({ PAYMENT_PROVIDER: 'midtrans' })).toThrow('PAYMENT_CREATE_URL_REQUIRED'); });
});
