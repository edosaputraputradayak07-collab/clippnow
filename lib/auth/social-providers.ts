export type SocialProvider = 'google' | 'facebook' | 'tiktok';

export const SOCIAL_PROVIDERS: SocialProvider[] = ['google', 'facebook', 'tiktok'];

export function getSocialProviderLabel(provider: SocialProvider): string {
  return provider[0].toUpperCase() + provider.slice(1);
}

export function getSocialProviderError(provider: SocialProvider): string {
  if (provider === 'tiktok') {
    return 'Login TikTok belum aktif di Supabase Auth. Aktifkan custom:tiktok OAuth provider terlebih dahulu.';
  }

  return `Login ${getSocialProviderLabel(provider)} belum tersedia. Aktifkan provider di Supabase Auth.`;
}
