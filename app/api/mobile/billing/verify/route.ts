import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getMobileUser } from '@/lib/auth/mobile-request';
import { createAdminClient } from '@/lib/supabase/admin';
import { getBillingProduct } from '@/lib/billing/catalog';
import { noStoreHeaders } from '@/lib/security/request';

const IAPKIT_VERIFY_URL = 'https://kit.openiap.dev/v1/purchase/verify';

type Platform = 'ios' | 'android';

type Body = {
  platform?: Platform;
  productId?: string;
  proof?: string;
};

type Verification = {
  store?: string;
  isValid?: boolean;
  state?: string;
  productId?: string;
};

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: noStoreHeaders() });
}

export async function POST(request: Request) {
  const mobileUser = await getMobileUser(request);
  if (!mobileUser) return errorResponse('Unauthorized', 401);

  const iapkitKey = process.env.IAPKIT_PUBLISHABLE_KEY;
  if (!iapkitKey) return errorResponse('Native billing verification belum dikonfigurasi.', 503);

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return errorResponse('Payload tidak valid.', 400);
  }

  const platform = body.platform;
  const productId = body.productId?.trim();
  const proof = body.proof?.trim();
  if ((platform !== 'ios' && platform !== 'android') || !productId || !proof) {
    return errorResponse('Platform, productId, dan purchase proof wajib diisi.', 400);
  }
  if (proof.length > 16384) return errorResponse('Purchase proof terlalu besar.', 413);

  const product = getBillingProduct(productId);
  if (!product) return errorResponse('Produk tidak dikenal.', 400);

  const verificationBody = platform === 'ios'
    ? { store: 'apple', jws: proof, expectedProductId: productId }
    : { store: 'google', purchaseToken: proof, expectedProductId: productId };

  const verification = await fetch(IAPKIT_VERIFY_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${iapkitKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(verificationBody),
    cache: 'no-store',
  });

  const result = (await verification.json().catch(() => ({}))) as Verification;
  if (!verification.ok) {
    return errorResponse('Verifikasi pembayaran gagal. Silakan coba lagi.', 502);
  }
  if (result.isValid !== true || result.productId !== productId) {
    return errorResponse('Pembayaran tidak dapat diverifikasi.', 402);
  }

  const allowedStates = new Set(['ENTITLED', 'READY_TO_CONSUME', 'PENDING_ACKNOWLEDGMENT']);
  if (!result.state || !allowedStates.has(result.state)) {
    return errorResponse('Status pembayaran belum dapat dipenuhi.', 409);
  }

  // The proof hash is deliberately derived server-side after store verification.
  // It is used only as an idempotency key; the store remains the authority.
  const transactionKey = createHash('sha256').update(`${platform}:${proof}`).digest('hex');
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('grant_clippnow_native_purchase', {
    p_user_id: mobileUser.user.id,
    p_platform: platform,
    p_product_id: productId,
    p_store_transaction_id: transactionKey,
    p_state: result.state,
    p_credits: product.credits,
  });

  if (error || !data?.[0]) {
    return errorResponse('Pembelian terverifikasi, tetapi kredit belum dapat diberikan. Jangan ulangi pembayaran; silakan coba lagi.', 500);
  }

  if (product.kind === 'subscription' && data[0].granted) {
    const plan = product.id.includes('_pro_') ? 'pro' : 'creator';
    await admin.from('profiles').update({ plan, updated_at: new Date().toISOString() }).eq('id', mobileUser.user.id);
  }

  return NextResponse.json({
    verified: true,
    product_id: productId,
    credits_granted: data[0].granted ? product.credits : 0,
    credits_remaining: data[0].credits,
    already_processed: !data[0].granted,
  }, { headers: noStoreHeaders() });
}
