import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isOwnerPlan } from '@/lib/billing/access';
import { noStoreHeaders, sameOrigin } from '@/lib/security/request';

const PLANS = {
  starter: { amount: 49000, credits: 10 },
  creator: { amount: 99000, credits: 30 },
  pro: { amount: 199000, credits: 100 },
} as const;

type Plan = keyof typeof PLANS;

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403, headers: noStoreHeaders() });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders() });

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profil akun tidak ditemukan.' }, { status: 500, headers: noStoreHeaders() });
  }

  if (isOwnerPlan(profile.plan)) {
    return NextResponse.json({ error: 'Akun owner ClippNow sudah unlimited dan tidak perlu membeli paket.' }, { status: 409, headers: noStoreHeaders() });
  }

  const body = await request.json().catch(() => ({}));
  const plan = body.plan as Plan;
  if (!plan || !PLANS[plan]) return NextResponse.json({ error: 'Paket tidak valid.' }, { status: 400, headers: noStoreHeaders() });

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return NextResponse.json({ error: 'Payment gateway belum dikonfigurasi.' }, { status: 503, headers: noStoreHeaders() });

  const selected = PLANS[plan];
  const orderId = `CLIPP-${user.id.slice(0, 8)}-${Date.now()}`;

  const { error: insertError } = await admin.from('payments').insert({
    user_id: user.id,
    plan,
    amount_idr: selected.amount,
    credits: selected.credits,
    status: 'pending',
    provider: 'midtrans',
    provider_order_id: orderId,
  });

  if (insertError) return NextResponse.json({ error: 'Gagal membuat transaksi.' }, { status: 500, headers: noStoreHeaders() });

  const baseUrl = process.env.MIDTRANS_IS_PRODUCTION === 'true'
    ? 'https://app.midtrans.com'
    : 'https://app.sandbox.midtrans.com';

  try {
    const response = await fetch(`${baseUrl}/snap/v1/transactions`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`,
      },
      body: JSON.stringify({
        transaction_details: { order_id: orderId, gross_amount: selected.amount },
        customer_details: { email: user.email },
      }),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.token) {
      await admin.from('payments').update({ status: 'failed' }).eq('provider_order_id', orderId);
      return NextResponse.json({ error: 'Midtrans menolak transaksi.' }, { status: 502, headers: noStoreHeaders() });
    }

    return NextResponse.json({ token: data.token, redirect_url: data.redirect_url, order_id: orderId }, { headers: noStoreHeaders() });
  } catch {
    await admin.from('payments').update({ status: 'failed' }).eq('provider_order_id', orderId);
    return NextResponse.json({ error: 'Payment gateway tidak dapat dihubungi.' }, { status: 502, headers: noStoreHeaders() });
  }
}
