import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildYouTubeOAuthUrl, requireYouTubeOAuthConfig } from '@/lib/youtube/oauth';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/auth/login', request.url));

  let config;
  try {
    config = requireYouTubeOAuthConfig();
  } catch {
    return NextResponse.redirect(new URL('/dashboard?youtube=not-configured', request.url));
  }

  const state = crypto.randomBytes(32).toString('base64url');
  const store = await cookies();
  store.set('clippnow_youtube_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return NextResponse.redirect(buildYouTubeOAuthUrl({
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    state,
  }));
}
