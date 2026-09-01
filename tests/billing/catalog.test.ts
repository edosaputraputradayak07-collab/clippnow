import { describe, expect, it } from 'vitest';
import { BILLING_PRODUCTS, getBillingProduct } from '../../lib/billing/catalog';

describe('native billing product catalog', () => {
  it('keeps store product IDs stable and maps every product to a valid product kind', () => {
    expect(BILLING_PRODUCTS.length).toBeGreaterThan(0);
    for (const product of BILLING_PRODUCTS) {
      expect(product.id).toMatch(/^[a-z0-9_.-]+$/);
      expect(product.credits).toBeGreaterThanOrEqual(0);
      expect(['subscription', 'consumable']).toContain(product.kind);
    }
  });

  it('includes recurring plans with sustained value', () => {
    const subscriptions = BILLING_PRODUCTS.filter((product) => product.kind === 'subscription');
    expect(subscriptions.length).toBeGreaterThan(0);
    expect(subscriptions.every((product) => product.monthlyValue)).toBe(true);
  });

  it('resolves a product by its stable ID', () => {
    const product = BILLING_PRODUCTS[0];
    expect(getBillingProduct(product.id)).toEqual(product);
    expect(getBillingProduct('missing-product')).toBeUndefined();
  });
});
