import { creditsForDuration, availableCredits, type CreditWallet } from './credits';

export type CreditGateResult = { allowed: true; required: number; available: number } | { allowed: false; required: number; available: number; reason: 'INSUFFICIENT_CREDITS' };

export function checkCreditGate(wallet: CreditWallet, durationMs: number): CreditGateResult {
  const required = creditsForDuration(durationMs);
  const available = availableCredits(wallet);
  return available >= required ? { allowed: true, required, available } : { allowed: false, required, available, reason: 'INSUFFICIENT_CREDITS' };
}
