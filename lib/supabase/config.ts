const CLIPPNOW_SUPABASE_URL = 'https://hwsoqzdqdqsgeswtsjih.supabase.co';

type SupabaseEnv = Record<string, string | undefined>;

export function getSupabaseConfig(env: SupabaseEnv = process.env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim() || CLIPPNOW_SUPABASE_URL;
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!publishableKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required.');
  }

  return { url, publishableKey };
}
