type AdminKeyEnv = Record<string, string | undefined>;

export function resolveSupabaseAdminKey(env: AdminKeyEnv = process.env): string {
  const directSecret = env.SUPABASE_SECRET_KEY?.trim();
  if (directSecret) return directSecret;

  const secretKeys = env.SUPABASE_SECRET_KEYS?.trim();
  if (secretKeys) {
    try {
      const parsed = JSON.parse(secretKeys) as Record<string, unknown>;
      const defaultSecret = typeof parsed.default === 'string' ? parsed.default.trim() : '';
      if (defaultSecret) return defaultSecret;
    } catch {
      // Ignore malformed hosted secret-key JSON and continue to the legacy fallback.
    }
  }

  const legacyServiceRole = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (legacyServiceRole) return legacyServiceRole;

  throw new Error('Supabase admin key is not configured');
}
