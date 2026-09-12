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

  it('falls back to the bundled public Supabase configuration when deployment variables are unavailable', () => {
    const config = getSupabaseConfig({});

    expect(config.url).toBe('https://hwsoqzdqdqsgeswtsjih.supabase.co');
    expect(config.publishableKey).toMatch(/^sb_publishable_/);
  });
});
