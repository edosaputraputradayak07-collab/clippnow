export function getLoginErrorMessage(error: { message?: string } | null): string {
  if (error?.message === 'Invalid login credentials') {
    return 'Akun belum terdaftar atau password salah. Jika belum punya akun, pilih Daftar gratis.';
  }

  return 'Login belum berhasil. Periksa email dan password lalu coba lagi.';
}
