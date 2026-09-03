const CLIPPNOW_SUPABASE_URL = 'https://hailjjuaxatdaiskazgq.supabase.co';
const CLIPPNOW_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_VhYzxCvRiKsl-maZByhwRA_k_HBsOCZ';

type SupabaseEnv = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
};

export function getSupabaseConfig(env: SupabaseEnv = process.env) {
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL?.trim() || CLIPPNOW_SUPABASE_URL,
    publishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || CLIPPNOW_SUPABASE_PUBLISHABLE_KEY,
  };
}
