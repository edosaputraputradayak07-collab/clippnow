import { describe, expect, it, vi } from 'vitest';
import { runPasswordLogin } from './login-flow';

describe('runPasswordLogin', () => {
  it('returns a visible failure when client initialization throws', async () => {
    const result = await runPasswordLogin(() => {
      throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required.');
    }, 'user@example.com', 'password');

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected login to fail.');
    expect(result.message).toBe('Login belum bisa dijalankan. Konfigurasi autentikasi belum tersedia.');
  });

  it('returns a visible failure when the auth request rejects', async () => {
    const result = await runPasswordLogin(
      () => ({ auth: { signInWithPassword: vi.fn().mockRejectedValue(new Error('Network failure')) } }),
      'user@example.com',
      'password',
    );

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected login to fail.');
    expect(result.message).toBe('Login gagal terhubung ke server. Periksa koneksi lalu coba lagi.');
  });

  it('normalizes the email before sending it to Supabase', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
    const createClient = () => ({ auth: { signInWithPassword } });

    const result = await runPasswordLogin(createClient, '  USER@EXAMPLE.COM ', 'password123');

    expect(result).toEqual({ ok: true });
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password123' });
  });

  it('does not call Supabase when credentials are invalid locally', async () => {
    const signInWithPassword = vi.fn();
    const createClient = () => ({ auth: { signInWithPassword } });

    const result = await runPasswordLogin(createClient, 'not-an-email', '123');

    expect(result).toEqual({ ok: false, message: 'Format email belum benar.' });
    expect(signInWithPassword).not.toHaveBeenCalled();
  });
});
