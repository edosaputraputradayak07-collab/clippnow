import { describe, expect, it } from 'vitest';
import { SOCIAL_PROVIDERS, getSocialProviderLabel, getSocialProviderError } from './social-providers';

describe('social authentication providers', () => {
  it('exposes Google, Facebook, and TikTok in the login order', () => {
    expect(SOCIAL_PROVIDERS).toEqual(['google', 'facebook', 'tiktok']);
  });

  it('uses the Supabase custom OAuth identifier for TikTok', () => {
    expect(getSocialProviderLabel('tiktok')).toBe('TikTok');
    expect(getSocialProviderError('tiktok')).toContain('custom:tiktok');
  });

  it('keeps provider labels user-friendly', () => {
    expect(getSocialProviderLabel('google')).toBe('Google');
    expect(getSocialProviderLabel('facebook')).toBe('Facebook');
  });
});
