import { describe, expect, it } from 'vitest';
import { getProxySupabaseConfig } from './proxy-config';

describe('getProxySupabaseConfig', () => {
  it('falls back to the known public Supabase config when deployment env is missing', () => {
    expect(getProxySupabaseConfig({})).toEqual({
      url: 'https://hailjjuaxatdaiskazgq.supabase.co',
      publishableKey: 'sb_publishable_VhYzxCvRiKsl-maZByhwRA_k_HBsOCZ',
    });
  });

  it('prefers deployment environment values when both are configured', () => {
    expect(getProxySupabaseConfig({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
    })).toEqual({
      url: 'https://example.supabase.co',
      publishableKey: 'sb_publishable_example',
    });
  });
});
