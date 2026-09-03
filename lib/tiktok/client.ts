import { createAdminClient } from '@/lib/supabase/admin';
import { decryptTikTokToken, encryptTikTokToken, getTikTokTokenKey } from './secure-token';

export type TikTokAccount = {
  id: string;
  user_id: string;
  open_id: string;
  display_name: string | null;
  avatar_url: string | null;
  access_token_enc: string;
  refresh_token_enc: string;
  access_token_expires_at: string | null;
  refresh_token_expires_at: string | null;
  scopes: string[];
};

export async function getTikTokAccount(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('tiktok_accounts').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data as TikTokAccount | null;
}

export async function getFreshTikTokAccessToken(account: TikTokAccount) {
  const key = getTikTokTokenKey();
  const expiresAt = account.access_token_expires_at ? new Date(account.access_token_expires_at).getTime() : 0;
  if (expiresAt > Date.now() + 60_000) return decryptTikTokToken(account.access_token_enc, key);

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (!clientKey || !clientSecret) throw new Error('TikTok belum dikonfigurasi');
  const refreshToken = decryptTikTokToken(account.refresh_token_enc, key);
  const body = new URLSearchParams({ client_key: clientKey, client_secret: clientSecret, grant_type: 'refresh_token', refresh_token: refreshToken });
  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cache-Control': 'no-cache' }, body, cache: 'no-store' });
  const token = await response.json() as { access_token?: string; refresh_token?: string; expires_in?: number; refresh_expires_in?: number; scope?: string; error_description?: string };
  if (!response.ok || !token.access_token || !token.refresh_token) throw new Error(token.error_description ?? 'TikTok token refresh gagal');
  const admin = createAdminClient();
  const { error } = await admin.from('tiktok_accounts').update({ access_token_enc: encryptTikTokToken(token.access_token, key), refresh_token_enc: encryptTikTokToken(token.refresh_token, key), access_token_expires_at: new Date(Date.now() + (token.expires_in ?? 86400) * 1000).toISOString(), refresh_token_expires_at: new Date(Date.now() + (token.refresh_expires_in ?? 31536000) * 1000).toISOString(), scopes: (token.scope ?? account.scopes.join(',')).split(',').map((s) => s.trim()).filter(Boolean), updated_at: new Date().toISOString() }).eq('id', account.id);
  if (error) throw error;
  return token.access_token;
}
