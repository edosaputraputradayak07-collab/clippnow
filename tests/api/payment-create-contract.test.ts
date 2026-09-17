import { describe, expect, it } from 'vitest';

describe('payment creation contract', () => {
  it('requires a pending payment record before invoking the provider', async () => {
    const source = await import('../../app/api/payments/create/route');
    expect(source.POST.toString()).toContain("from('payments')");
    expect(source.POST.toString()).toMatch(/insert\([\s\S]*status/);
    expect(source.POST.toString().indexOf("from('payments')")).toBeLessThan(source.POST.toString().indexOf('provider.createPayment'));
  });
});
