import { describe, expect, it } from 'vitest';
import { buildYouTubeOAuthUrl } from './oauth';

describe('buildYouTubeOAuthUrl', () => {
  it('builds a Google authorization URL with the YouTube readonly scope', () => {
    const url = new URL(buildYouTubeOAuthUrl({
      clientId: 'client-123',
      redirectUri: 'https://clippnoww.vercel.app/api/youtube/callback',
      state: 'state-abc',
    }));

    expect(url.origin).toBe('https://accounts.google.com');
    expect(url.pathname).toBe('/o/oauth2/v2/auth');
    expect(url.searchParams.get('client_id')).toBe('client-123');
    expect(url.searchParams.get('redirect_uri')).toBe('https://clippnoww.vercel.app/api/youtube/callback');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('state')).toBe('state-abc');
    expect(url.searchParams.get('access_type')).toBe('offline');
    expect(url.searchParams.get('prompt')).toBe('consent');
    expect(url.searchParams.get('scope')).toBe('https://www.googleapis.com/auth/youtube.readonly');
  });
});
