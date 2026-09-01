export type BillingProductKind = 'subscription' | 'consumable';

export type BillingProduct = {
  id: string;
  kind: BillingProductKind;
  displayName: string;
  credits: number;
  monthlyValue?: string;
};

/**
 * Store IDs are intentionally stable and lowercase. The actual products must
 * be created and activated in App Store Connect and Google Play Console before
 * production billing is enabled.
 */
export const BILLING_PRODUCTS: readonly BillingProduct[] = [
  {
    id: 'clippnow_creator_monthly',
    kind: 'subscription',
    displayName: 'Creator Monthly',
    credits: 30,
    monthlyValue: '30 credits + Creator features',
  },
  {
    id: 'clippnow_pro_monthly',
    kind: 'subscription',
    displayName: 'Pro Monthly',
    credits: 100,
    monthlyValue: '100 credits + Pro features',
  },
  {
    id: 'clippnow_credits_30',
    kind: 'consumable',
    displayName: '30 Credits',
    credits: 30,
  },
  {
    id: 'clippnow_credits_100',
    kind: 'consumable',
    displayName: '100 Credits',
    credits: 100,
  },
] as const;

export function getBillingProduct(productId: string): BillingProduct | undefined {
  return BILLING_PRODUCTS.find((product) => product.id === productId);
}
