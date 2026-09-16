import { createHmac, timingSafeEqual } from 'node:crypto';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
export type PaymentRequest = { userId: string; credits: number; amountIdr: number; orderId: string; description: string };
export type PaymentResult = { provider: string; externalId: string; status: PaymentStatus; checkoutUrl: string | null };
export type PaymentProvider = { name: string; createPayment: (input: PaymentRequest) => Promise<PaymentResult>; verifyWebhook: (rawBody: string, signature: string) => boolean };

export function verifyHmacSignature(rawBody: string, signature: string, secret: string): boolean {
  if (!rawBody || !signature || !secret) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const left = Buffer.from(expected, 'utf8'); const right = Buffer.from(signature, 'utf8');
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createConfiguredPaymentProvider(env: NodeJS.ProcessEnv = process.env): PaymentProvider {
  const provider = (env.PAYMENT_PROVIDER || 'disabled').toLowerCase();
  const webhookSecret = env.PAYMENT_WEBHOOK_SECRET || '';
  if (provider === 'disabled') {
    return { name: 'disabled', createPayment: async () => { throw new Error('PAYMENT_PROVIDER_NOT_CONFIGURED'); }, verifyWebhook: () => false };
  }
  const endpoint = env.PAYMENT_CREATE_URL;
  if (!endpoint) throw new Error('PAYMENT_CREATE_URL_REQUIRED');
  return {
    name: provider,
    async createPayment(input) {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', ...(env.PAYMENT_API_KEY ? { authorization: `Bearer ${env.PAYMENT_API_KEY}` } : {}) }, body: JSON.stringify(input), cache: 'no-store' });
      if (!response.ok) throw new Error(`PAYMENT_CREATE_FAILED:${response.status}`);
      const body = await response.json() as { externalId?: string; checkoutUrl?: string; status?: PaymentStatus };
      if (!body.externalId) throw new Error('PAYMENT_EXTERNAL_ID_REQUIRED');
      return { provider, externalId: body.externalId, status: body.status || 'pending', checkoutUrl: body.checkoutUrl || null };
    },
    verifyWebhook: (rawBody, signature) => verifyHmacSignature(rawBody, signature, webhookSecret),
  };
}
