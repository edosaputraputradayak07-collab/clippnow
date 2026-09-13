type ValidationResult =
  | { ok: true; email: string }
  | { ok: false; message: string };

export function validateLoginCredentials(emailInput: string, password: string): ValidationResult {
  const email = emailInput.trim().toLowerCase();
  if (!email || !password) return { ok: false, message: 'Email dan password wajib diisi.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: 'Format email belum benar.' };
  }
  if (password.length < 6) return { ok: false, message: 'Password minimal 6 karakter.' };
  return { ok: true, email };
}
