import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { encryptYouTubeToken } from '@/lib/youtube/tokens';
import { requireYouTubeOAuthConfig } from '@/lib/youtube/oauth';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CHANNELS_URL = 'https://www.googleapis.com/youtube/v3/channels';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  if (error || !code || !state) return NextResponse.redirect(`${origin}/dashboard?youtube=cancelled`);

  const store = await cookies();
  const expectedState = store.get('clippnow_youtube_oauth_state')?.value;
  store.delete('clippnow_youtube_oauth_state');
  if (!expectedState || !cryptoSafeEqual(expectedState, state)) {
    return NextResponse.redirect(`${origin}/dashboard?youtube=invalid_state`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/auth/login`);

  try {
    const config = requireYouTubeOAuthConfig();
    const tokenResponse = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
      }),
      cache: 'no-store',
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok || !tokens.access_token || !tokens.refresh_token) throw new Error('Google token exchange failed.');

    const channelResponse = await fetch(`${CHANNELS_URL}?part=snippet,contentDetails&mine=true`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: 'no-store',
    });
    const channelPayload = await channelResponse.json();
    const channel = channelPayload.items?.[0];
    if (!channel?.id || !channel.snippet?.title) throw new Error('YouTube channel tidak ditemukan.');

    const admin = createAdminClient();
    const { error: upsertError } = await admin.from('youtube_accounts').upsert({
      user_id: user.id,
      channel_id: channel.id,
      channel_title: channel.snippet.title,
      channel_description: channel.snippet.description ?? null,
      channel_thumbnail_url: channel.snippet.thumbnails?.default?.url ?? null,
      uploads_playlist_id: channel.contentDetails?.relatedPlaylists?.uploads ?? null,
      access_token_encrypted: encryptYouTubeToken(tokens.access_token),
      refresh_token_encrypted: encryptYouTubeToken(tokens.refresh_token),
      access_token_expires_at: new Date(Date.now() + Number(tokens.expires_in ?? 3600) * 1000).toISOString(),
      scope: tokens.scope ?? 'https://www.googleapis.com/auth/youtube.readonly',
    }, { onConflict: 'user_id,channel_id' });
    if (upsertError) throw new Error(`YouTube account save failed: ${upsertError.message}`);

    return NextResponse.redirect(`${origin}/dashboard?youtube=connected`);
  } catch {
    return NextResponse.redirect(`${origin}/dashboard?youtube=error`);
  }
}

function cryptoSafeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && require('node:crypto').timingSafeEqual(left, right);
}
