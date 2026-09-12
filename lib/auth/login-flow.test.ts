import { describe, expect, it, vi } from 'vitest';
import { runPasswordLogin } from './login-flow';

describe('runPasswordLogin', () => {
  it('returns a visible failure when client initialization throws', async () => {
    const result = await runPasswordLogin(() => {
      throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required.');
    }, 'user@example.com', 'password');

    expect(result.ok).toBe(false);
    expect(result.message).toBe('Login belum bisa dijalankan. Konfigurasi autentikasi belum tersedia.');
  });

  it('returns a visible failure when the auth request rejects', async () => {
    const result = await runPasswordLogin(
      () => ({ auth: { signInWithPassword: vi.fn().mockRejectedValue(new Error('Network failure')) } }),
      'user@example.com',
      'password',
    );

    expect(result.ok).toBe(false);
    expect(result.message).toBe('Login gagal terhubung ke server. Periksa koneksi lalu coba lagi.');
  });
});
