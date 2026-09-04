const CLIPPNOW_SUPABASE_URL = 'https://hwsoqzdqdqsgeswtsjih.supabase.co';
const CLIPPNOW_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_oPN_Y9ujuDuvvvac9fJA7g_iYmaBV70';

type SupabaseEnv = Record<string, string | undefined>;

export function getSupabaseConfig(env: SupabaseEnv = process.env) {
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL?.trim() || CLIPPNOW_SUPABASE_URL,
    publishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || CLIPPNOW_SUPABASE_PUBLISHABLE_KEY,
  };
}
