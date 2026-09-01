import { describe, expect, it } from 'vitest';
import { BILLING_PRODUCTS, getBillingProduct } from '../../lib/billing/catalog';

describe('native billing product catalog', () => {
  it('keeps store product IDs stable and maps every product to credits', () => {
    expect(BILLING_PRODUCTS.length).toBeGreaterThan(0);
    for (const product of BILLING_PRODUCTS) {
      expect(product.id).toMatch(/^[a-z0-9_.-]+$/);
      expect(product.credits).toBeGreaterThan(0);
      expect(product.kind).toBe('consumable');
    }
  });

  it('resolves a product by its stable ID', () => {
    const product = BILLING_PRODUCTS[0];
    expect(getBillingProduct(product.id)).toEqual(product);
    expect(getBillingProduct('missing-product')).toBeUndefined();
  });
});
