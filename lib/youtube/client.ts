import { createAdminClient } from '@/lib/supabase/admin';
import { decryptYouTubeToken, encryptYouTubeToken } from './tokens';
import { requireYouTubeOAuthConfig } from './oauth';

const API_BASE = 'https://www.googleapis.com/youtube/v3';

type YouTubeAccount = {
  id: string;
  user_id: string;
  channel_id: string;
  channel_title: string;
  channel_description: string | null;
  channel_thumbnail_url: string | null;
  uploads_playlist_id: string | null;
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  access_token_expires_at: string;
};

export async function getYouTubeAccessToken(userId: string): Promise<string> {
  const admin = createAdminClient();
  const { data: account, error } = await admin.from('youtube_accounts').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(1).maybeSingle<YouTubeAccount>();
  if (error || !account) throw new Error('YouTube belum terhubung.');

  if (new Date(account.access_token_expires_at).getTime() > Date.now() + 60_000) {
    return decryptYouTubeToken(account.access_token_encrypted);
  }

  const config = requireYouTubeOAuthConfig();
  const refreshToken = decryptYouTubeToken(account.refresh_token_encrypted);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }),
    cache: 'no-store',
  });
  const payload = await response.json();
  if (!response.ok || !payload.access_token) throw new Error('YouTube session expired. Hubungkan YouTube lagi.');

  await admin.from('youtube_accounts').update({
    access_token_encrypted: encryptYouTubeToken(payload.access_token),
    access_token_expires_at: new Date(Date.now() + Number(payload.expires_in ?? 3600) * 1000).toISOString(),
  }).eq('id', account.id).eq('user_id', userId);

  return payload.access_token;
}

export async function listYouTubeAccounts(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('youtube_accounts').select('id,channel_id,channel_title,channel_description,channel_thumbnail_url,uploads_playlist_id,updated_at').eq('user_id', userId).order('updated_at', { ascending: false });
  if (error) throw new Error('Gagal mengambil akun YouTube.');
  return data ?? [];
}

export async function listYouTubeVideos(userId: string, maxResults = 20) {
  const admin = createAdminClient();
  const { data: account, error } = await admin.from('youtube_accounts').select('uploads_playlist_id').eq('user_id', userId).order('updated_at', { ascending: false }).limit(1).maybeSingle<{ uploads_playlist_id: string | null }>();
  if (error || !account?.uploads_playlist_id) throw new Error('Channel YouTube belum tersedia.');

  const accessToken = await getYouTubeAccessToken(userId);
  const params = new URLSearchParams({ part: 'snippet,contentDetails,status', playlistId: account.uploads_playlist_id, maxResults: String(Math.min(Math.max(maxResults, 1), 50)) });
  const response = await fetch(`${API_BASE}/playlistItems?${params}`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
  const payload = await response.json();
  if (!response.ok) throw new Error('Gagal mengambil video YouTube.');
  return (payload.items ?? []).map((item: any) => ({
    id: item.contentDetails?.videoId,
    title: item.snippet?.title ?? 'Untitled',
    description: item.snippet?.description ?? '',
    thumbnail: item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url ?? null,
    publishedAt: item.contentDetails?.videoPublishedAt ?? item.snippet?.publishedAt ?? null,
  })).filter((item: { id?: string }) => item.id);
}
