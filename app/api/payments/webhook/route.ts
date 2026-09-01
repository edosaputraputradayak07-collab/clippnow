import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createHash } from 'node:crypto';

export async function POST(request: Request) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return NextResponse.json({ error: 'Gateway not configured' }, { status: 503 });

  const payload = await request.json();
  const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status, transaction_id } = payload;
  if (!order_id || !status_code || !gross_amount || !signature_key) return NextResponse.json({ error: 'Invalid notification' }, { status: 400 });

  const expected = createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
    .digest('hex');
  if (expected !== signature_key) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });

  const success = transaction_status === 'settlement' || (transaction_status === 'capture' && fraud_status === 'accept');
  const admin = createAdminClient();
  const nextStatus = success ? 'paid' : transaction_status === 'expire' ? 'expired' : transaction_status === 'cancel' ? 'cancelled' : transaction_status === 'deny' ? 'failed' : 'pending';

  const { data: payment, error: lookupError } = await admin.from('payments').select('id,status').eq('provider_order_id', order_id).single();
  if (lookupError || !payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

  if (success && payment.status !== 'paid') {
    const { error } = await admin.rpc('finalize_clippnow_payment', { p_payment_id: payment.id });
    if (error) return NextResponse.json({ error: 'Failed to finalize payment' }, { status: 500 });
  } else if (!success && payment.status !== 'paid') {
    await admin.from('payments').update({ status: nextStatus, provider_transaction_id: transaction_id ?? null }).eq('id', payment.id);
  }

  return NextResponse.json({ received: true });
}
