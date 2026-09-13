import { getLoginErrorMessage } from './login-message';
import { validateLoginCredentials } from './credential-validation';

type PasswordAuthClient = {
  auth: {
    signInWithPassword: (input: { email: string; password: string }) => Promise<{
      error: Parameters<typeof getLoginErrorMessage>[0] | null;
    }>;
  };
};

type LoginResult =
  | { ok: true }
  | { ok: false; message: string };

const CONFIG_ERROR_MESSAGE = 'Login belum bisa dijalankan. Konfigurasi autentikasi belum tersedia.';
const NETWORK_ERROR_MESSAGE = 'Login gagal terhubung ke server. Periksa koneksi lalu coba lagi.';
const TIMEOUT_ERROR_MESSAGE = 'Login terlalu lama. Periksa koneksi lalu coba lagi.';

export async function runPasswordLogin(
  createClient: () => PasswordAuthClient,
  email: string,
  password: string,
  timeoutMs = 15000,
): Promise<LoginResult> {
  const credentials = validateLoginCredentials(email, password);
  if (!credentials.ok) return credentials;

  try {
    const client = createClient();
    const request = client.auth.signInWithPassword({ email: credentials.email, password });
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('AUTH_TIMEOUT')), timeoutMs);
    });
    const { error } = await Promise.race([request, timeout]);

    if (error) {
      return { ok: false, message: getLoginErrorMessage(error) };
    }

    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === 'AUTH_TIMEOUT') {
      return { ok: false, message: TIMEOUT_ERROR_MESSAGE };
    }

    if (error instanceof Error && error.message.includes('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')) {
      return { ok: false, message: CONFIG_ERROR_MESSAGE };
    }

    return { ok: false, message: NETWORK_ERROR_MESSAGE };
  }
}
