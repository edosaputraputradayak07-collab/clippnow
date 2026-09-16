import { describe, expect, it } from 'vitest';
import { createConfiguredPaymentProvider, verifyHmacSignature } from '../../src/lib/payments';

describe('security boundaries', () => {
  it('fails closed for unsigned payment webhooks', () => { const provider = createConfiguredPaymentProvider({ PAYMENT_PROVIDER: 'disabled' }); expect(provider.verifyWebhook('{}', '')).toBe(false); });
  it('accepts only exact HMAC signatures', () => { expect(verifyHmacSignature('payload', 'a'.repeat(64), 'secret')).toBe(false); });
  it('does not configure a payment provider without an explicit server endpoint', () => { expect(() => createConfiguredPaymentProvider({ PAYMENT_PROVIDER: 'provider' })).toThrow('PAYMENT_CREATE_URL_REQUIRED'); });
});
