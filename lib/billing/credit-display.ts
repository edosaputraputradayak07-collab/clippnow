export function formatCreditBalance(credits: number, plan: string): string {
  return plan === 'owner' ? '∞' : String(Math.max(0, credits));
}
