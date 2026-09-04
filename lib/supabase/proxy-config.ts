const FALLBACK_SUPABASE_URL = 'https://hailjjuaxatdaiskazgq.supabase.co';
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_VhYzxCvRiKsl-maZByhwRA_k_HBsOCZ';

type SupabaseEnv = Record<string, string | undefined>;

export function getProxySupabaseConfig(env: SupabaseEnv = process.env) {
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL?.trim() || FALLBACK_SUPABASE_URL,
    publishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || FALLBACK_SUPABASE_PUBLISHABLE_KEY,
  };
}
