import { describe, expect, it } from 'vitest';
import { resolveSupabaseAdminKey } from './admin-key';

describe('resolveSupabaseAdminKey', () => {
  it('prefers the new single secret key', () => {
    expect(resolveSupabaseAdminKey({
      SUPABASE_SECRET_KEY: 'sb_secret_primary',
      SUPABASE_SERVICE_ROLE_KEY: 'legacy_service_role',
    })).toBe('sb_secret_primary');
  });

  it('falls back to the legacy service role key when the new key is absent', () => {
    expect(resolveSupabaseAdminKey({
      SUPABASE_SERVICE_ROLE_KEY: 'legacy_service_role',
    })).toBe('legacy_service_role');
  });

  it('supports Supabase hosted secret-key JSON for the default key', () => {
    expect(resolveSupabaseAdminKey({
      SUPABASE_SECRET_KEYS: JSON.stringify({ default: 'sb_secret_default' }),
    })).toBe('sb_secret_default');
  });

  it('throws a clear error when no admin key is configured', () => {
    expect(() => resolveSupabaseAdminKey({})).toThrow('Supabase admin key is not configured');
  });
});
