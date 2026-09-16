import { NextResponse } from 'next/server';
import { createConfiguredPaymentProvider } from '../../../../src/lib/payments';
import { createSupabaseAdminClient } from '../../../../src/lib/supabase/admin';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-payment-signature') || '';
  const provider = createConfiguredPaymentProvider();
  if (!provider.verifyWebhook(rawBody, signature)) return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 401 });
  let event: { externalId?: string; status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled' };
  try { event = JSON.parse(rawBody); } catch { return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 }); }
  if (!event.externalId || !event.status) return NextResponse.json({ error: 'INVALID_WEBHOOK' }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  const { data: payment, error: paymentError } = await supabase.from('payments').select('id,user_id,credits,status').eq('provider', provider.name).eq('external_id', event.externalId).maybeSingle();
  if (paymentError) return NextResponse.json({ error: 'PAYMENT_LOOKUP_FAILED' }, { status: 500 });
  if (!payment) return NextResponse.json({ error: 'PAYMENT_NOT_FOUND' }, { status: 404 });
  if (payment.status !== 'paid' && event.status === 'paid') {
    const { error: grantError } = await supabase.rpc('grant_credits', { p_user_id: payment.user_id, p_amount: payment.credits, p_idempotency_key: `payment:${payment.id}`, p_description: `Credits from payment ${payment.id}` });
    if (grantError) return NextResponse.json({ error: 'CREDIT_GRANT_FAILED' }, { status: 500 });
  }
  const { error: updateError } = await supabase.from('payments').update({ status: event.status, paid_at: event.status === 'paid' ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq('id', payment.id);
  if (updateError) return NextResponse.json({ error: 'PAYMENT_UPDATE_FAILED' }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 200 });
}
