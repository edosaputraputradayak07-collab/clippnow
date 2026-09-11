export const YOUTUBE_READONLY_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly';

export type YouTubeOAuthConfig = {
  clientId: string;
  redirectUri: string;
  state: string;
};

export function buildYouTubeOAuthUrl(config: YouTubeOAuthConfig): string {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', YOUTUBE_READONLY_SCOPE);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', config.state);
  return url.toString();
}

export function requireYouTubeOAuthConfig(env: Record<string, string | undefined> = process.env) {
  const clientId = env.YOUTUBE_GOOGLE_CLIENT_ID?.trim();
  const clientSecret = env.YOUTUBE_GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = env.YOUTUBE_GOOGLE_REDIRECT_URI?.trim();
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('YouTube OAuth belum dikonfigurasi.');
  }
  return { clientId, clientSecret, redirectUri };
}

export function getYouTubeEncryptionKey(env: Record<string, string | undefined> = process.env): Buffer {
  const raw = env.YOUTUBE_TOKEN_ENCRYPTION_KEY?.trim();
  if (!raw) throw new Error('YouTube token encryption key belum dikonfigurasi.');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('YouTube token encryption key harus 32-byte base64.');
  return key;
}
