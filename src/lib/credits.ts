export const CREDITS_PER_MINUTE = 1;

export type CreditLedgerEntryType = 'grant' | 'purchase' | 'reserve' | 'consume' | 'release' | 'refund' | 'adjustment';
export type CreditWallet = { balance: number; reserved: number };

export function creditsForDuration(durationMs: number): number {
  if (!Number.isFinite(durationMs) || durationMs < 0) throw new Error('DURATION_INVALID');
  return Math.max(1, Math.ceil(durationMs / 60_000) * CREDITS_PER_MINUTE);
}

export function availableCredits(wallet: CreditWallet): number {
  if (wallet.balance < 0 || wallet.reserved < 0 || wallet.reserved > wallet.balance) throw new Error('WALLET_INVALID');
  return wallet.balance - wallet.reserved;
}

export function reserveCredits(wallet: CreditWallet, amount: number): CreditWallet {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error('CREDIT_AMOUNT_INVALID');
  if (availableCredits(wallet) < amount) throw new Error('INSUFFICIENT_CREDITS');
  return { ...wallet, reserved: wallet.reserved + amount };
}

export function consumeReservedCredits(wallet: CreditWallet, amount: number): CreditWallet {
  if (!Number.isInteger(amount) || amount <= 0 || wallet.reserved < amount) throw new Error('RESERVED_CREDITS_INVALID');
  return { balance: wallet.balance - amount, reserved: wallet.reserved - amount };
}

export function releaseReservedCredits(wallet: CreditWallet, amount: number): CreditWallet {
  if (!Number.isInteger(amount) || amount <= 0 || wallet.reserved < amount) throw new Error('RESERVED_CREDITS_INVALID');
  return { ...wallet, reserved: wallet.reserved - amount };
}
