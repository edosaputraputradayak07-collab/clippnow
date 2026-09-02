import { supabase } from './supabase';
import { buildMobileRequest } from './request';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://clippnoww.vercel.app';

export async function verifyNativePurchase(input: {
  platform: 'ios' | 'android';
  productId: string;
  proof: string;
}) {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) throw new Error('Sesi login sudah berakhir.');

  const response = await fetch(buildMobileRequest(apiBaseUrl, '/api/mobile/billing/verify', data.session.access_token, {
    method: 'POST',
    body: JSON.stringify(input),
  }));
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof payload?.error === 'string' ? payload.error : 'Verifikasi pembayaran gagal.');
  return payload as {
    verified: true;
    product_id: string;
    credits_granted: number;
    credits_remaining: number;
    already_processed: boolean;
  };
}
