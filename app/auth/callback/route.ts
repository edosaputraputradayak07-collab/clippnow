import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseConfig } from '@/lib/supabase/config';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=oauth`);
  }

  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/auth/login?error=oauth`);
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
