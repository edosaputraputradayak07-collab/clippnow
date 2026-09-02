import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createHash, timingSafeEqual } from 'node:crypto';
import { getClientIp, logSecurityEvent, securityGuard } from '@/lib/security/defense';
import { noStoreHeaders } from '@/lib/security/request';

function signaturesMatch(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(received, 'utf8');
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers) ?? 'unknown';
  if (!(await securityGuard(`midtrans-webhook:${ip}`, 120, 60))) {
    await logSecurityEvent({ eventType: 'rate_limit_webhook', severity: 'warning', request });
    return NextResponse.json({ error: 'Too many notifications.' }, { status: 429, headers: noStoreHeaders() });
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return NextResponse.json({ error: 'Gateway not configured' }, { status: 503, headers: noStoreHeaders() });

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== 'object') {
    await logSecurityEvent({ eventType: 'invalid_webhook_payload', severity: 'warning', request });
    return NextResponse.json({ error: 'Invalid notification' }, { status: 400, headers: noStoreHeaders() });
  }

  const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status, transaction_id } = payload as Record<string, unknown>;
  if (typeof order_id !== 'string' || !order_id.startsWith('CLIPP-') || typeof status_code !== 'string' || typeof gross_amount !== 'string' || typeof signature_key !== 'string') {
    await logSecurityEvent({ eventType: 'malformed_webhook', severity: 'warning', request, metadata: { order_prefix: typeof order_id === 'string' ? order_id.slice(0, 20) : null } });
    return NextResponse.json({ error: 'Invalid notification' }, { status: 400, headers: noStoreHeaders() });
  }

  const expected = createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
    .digest('hex');
  if (!signaturesMatch(expected, signature_key)) {
    await logSecurityEvent({ eventType: 'invalid_webhook_signature', severity: 'critical', request, metadata: { order_prefix: order_id.slice(0, 20) } });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401, headers: noStoreHeaders() });
  }

  const success = transaction_status === 'settlement' || (transaction_status === 'capture' && fraud_status === 'accept');
  const admin = createAdminClient();
  const { data: payment, error: lookupError } = await admin
    .from('payments')
    .select('id,status,amount_idr,provider,provider_order_id,user_id')
    .eq('provider_order_id', order_id)
    .single();

  if (lookupError || !payment || payment.provider !== 'midtrans') {
    await logSecurityEvent({ eventType: 'unknown_payment_webhook', severity: 'warning', request, metadata: { order_prefix: order_id.slice(0, 20) } });
    return NextResponse.json({ error: 'Payment not found' }, { status: 404, headers: noStoreHeaders() });
  }

  if (Number(gross_amount) !== Number(payment.amount_idr)) {
    await logSecurityEvent({ userId: payment.user_id, eventType: 'payment_amount_mismatch', severity: 'critical', request, metadata: { order_prefix: order_id.slice(0, 20) } });
    return NextResponse.json({ error: 'Amount mismatch' }, { status: 400, headers: noStoreHeaders() });
  }

  const nextStatus = success ? 'paid' : transaction_status === 'expire' ? 'expired' : transaction_status === 'cancel' ? 'cancelled' : transaction_status === 'deny' ? 'failed' : 'pending';

  if (success && payment.status !== 'paid') {
    const { error } = await admin.rpc('finalize_clippnow_payment', { p_payment_id: payment.id });
    if (error) return NextResponse.json({ error: 'Failed to finalize payment' }, { status: 500, headers: noStoreHeaders() });
  } else if (!success && payment.status !== 'paid') {
    await admin.from('payments').update({ status: nextStatus, provider_transaction_id: typeof transaction_id === 'string' ? transaction_id : null }).eq('id', payment.id);
  }

  return NextResponse.json({ received: true }, { headers: noStoreHeaders() });
}
