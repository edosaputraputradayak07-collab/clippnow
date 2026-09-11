import { describe, expect, it } from 'vitest';
import { getOAuthErrorMessage } from './oauth-error';

describe('OAuth error messages', () => {
  it('explains provider configuration errors from Supabase', () => {
    expect(getOAuthErrorMessage('Unsupported provider: google', 'Google'))
      .toBe('Google belum aktif di Supabase Auth. Aktifkan provider Google lalu coba lagi.');
  });

  it('preserves useful provider error details for unknown failures', () => {
    expect(getOAuthErrorMessage('invalid redirect URL', 'Facebook'))
      .toBe('Login Facebook gagal: invalid redirect URL');
  });

  it('falls back to a friendly generic message', () => {
    expect(getOAuthErrorMessage('', 'TikTok'))
      .toBe('Login TikTok gagal. Periksa konfigurasi OAuth lalu coba lagi.');
  });
});
