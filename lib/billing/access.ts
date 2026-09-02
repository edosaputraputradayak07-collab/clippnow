export type ClippNowPlan = 'trial' | 'starter' | 'creator' | 'pro' | 'owner';

/** Owner accounts are exempt from credit consumption and paid checkout. */
export function isOwnerPlan(plan: string | null | undefined): plan is 'owner' {
  return plan === 'owner';
}
