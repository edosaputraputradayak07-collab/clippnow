const PROVIDER_CONFIG_ERRORS = new Set([
  'Unsupported provider',
  'provider is not enabled',
  'provider not enabled',
]);

export function getOAuthErrorMessage(rawMessage: string, providerLabel: string): string {
  const message = rawMessage.trim();

  if (!message) {
    return `Login ${providerLabel} gagal. Periksa konfigurasi OAuth lalu coba lagi.`;
  }

  const normalized = message.toLowerCase();
  if (
    [...PROVIDER_CONFIG_ERRORS].some((fragment) => normalized.includes(fragment.toLowerCase())) ||
    normalized.includes('unsupported provider')
  ) {
    return `${providerLabel} belum aktif di Supabase Auth. Aktifkan provider ${providerLabel} lalu coba lagi.`;
  }

  return `Login ${providerLabel} gagal: ${message}`;
}
