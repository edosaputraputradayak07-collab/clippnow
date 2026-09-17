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
  const supabase = await createSupabaseServerClient();
  const pending = await supabase.from('payments').insert({ user_id: user.id, provider: process.env.PAYMENT_PROVIDER || 'configured', external_id: orderId, status: 'pending', amount: pack.amountIdr, currency: 'IDR', credits: pack.credits, metadata: { orderId } }).select('id').single();
  if (pending.error || !pending.data?.id) return NextResponse.json({ error: 'PAYMENT_RECORD_FAILED' }, { status: 500 });

  try {
    const provider = createConfiguredPaymentProvider();
    const payment = await provider.createPayment({ userId: user.id, credits: pack.credits, amountIdr: pack.amountIdr, orderId, description: `VidClipMoney ${pack.credits} credits` });
    const { error } = await supabase.from('payments').update({ provider: payment.provider, external_id: payment.externalId, status: payment.status, metadata: { orderId, providerPayment: payment } }).eq('id', pending.data.id).eq('user_id', user.id);
    if (error) return NextResponse.json({ error: 'PAYMENT_UPDATE_FAILED' }, { status: 500 });
    return NextResponse.json({ payment: { ...payment, orderId, credits: pack.credits, amountIdr: pack.amountIdr } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PAYMENT_PROVIDER_FAILED';
    await supabase.from('payments').update({ status: 'failed', metadata: { orderId, error: message } }).eq('id', pending.data.id).eq('user_id', user.id);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
