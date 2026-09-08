import { createClient } from '@supabase/supabase-js';
import { resolveSupabaseAdminKey } from './admin-key';

export function createAdminClient() {
  const secret = resolveSupabaseAdminKey();
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
