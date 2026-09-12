import { describe, expect, it } from 'vitest';
import { getSupabaseConfig } from './config';

describe('getSupabaseConfig', () => {
  it('prefers deployment environment variables when available', () => {
    expect(getSupabaseConfig({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
    })).toEqual({
      url: 'https://example.supabase.co',
      publishableKey: 'sb_publishable_example',
    });
  });

  it('requires the public publishable key when deployment variables are unavailable', () => {
    expect(() => getSupabaseConfig({})).toThrow(
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required.',
    );
  });
});
