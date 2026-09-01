import { createClient as createSupabaseClient, type SupabaseClient, type User } from '@supabase/supabase-js';

export function getBearerToken(request: Request): string | null {
  const value = request.headers.get('authorization');
  if (!value) return null;
  const match = /^Bearer\s+([^\s]+)$/i.exec(value.trim());
  return match?.[1] ?? null;
}

export function createMobileClient(request: Request): { client: SupabaseClient; token: string } | null {
  const token = getBearerToken(request);
  if (!token) return null;

  const client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    },
  );

  return { client, token };
}

export async function getMobileUser(request: Request): Promise<{ client: SupabaseClient; user: User } | null> {
  const context = createMobileClient(request);
  if (!context) return null;
  const { data, error } = await context.client.auth.getUser(context.token);
  if (error || !data.user) return null;
  return { client: context.client, user: data.user };
}
