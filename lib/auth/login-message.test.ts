import { describe, expect, it } from 'vitest';
import { getLoginErrorMessage } from './login-message';

describe('getLoginErrorMessage', () => {
  it('explains that invalid credentials can also mean the account has not been created', () => {
    expect(getLoginErrorMessage({ message: 'Invalid login credentials' })).toBe(
      'Akun belum terdaftar atau password salah. Jika belum punya akun, pilih Daftar gratis.',
    );
  });
});
