import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../src/lib/auth';
import { createConfiguredPaymentProvider } from '../../../../src/lib/payments';
import { createSupabaseServerClient } from '../../../../src/lib/supabase/server';

const PACKAGES: Record<number, { credits: number; amountIdr: number }> = { 10: { credits: 10, amountIdr: 25000 }, 30: { credits: 30, amountIdr: 65000 }, 100: { credits: 100, amountIdr: 190000 } };

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  let body: { credits?: number };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 }); }
  const pack = body.credits ? PACKAGES[body.credits] : undefined;
  if (!pack) return NextResponse.json({ error: 'INVALID_CREDIT_PACKAGE' }, { status: 400 });
  const orderId = `vcm-${randomUUID()}`;
  const provider = createConfiguredPaymentProvider();
  const payment = await provider.createPayment({ userId: user.id, credits: pack.credits, amountIdr: pack.amountIdr, orderId, description: `VidClipMoney ${pack.credits} credits` });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('payments').insert({ user_id: user.id, provider: payment.provider, external_id: payment.externalId, status: payment.status, amount: pack.amountIdr, currency: 'IDR', credits: pack.credits, metadata: { orderId } });
  if (error) return NextResponse.json({ error: 'PAYMENT_RECORD_FAILED' }, { status: 500 });
  return NextResponse.json({ payment: { ...payment, orderId, credits: pack.credits, amountIdr: pack.amountIdr } }, { status: 201 });
}
