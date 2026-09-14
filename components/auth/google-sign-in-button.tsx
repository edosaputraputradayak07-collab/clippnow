'use client';

import { createSupabaseBrowserClient } from '../../src/lib/supabase/browser';

export function GoogleSignInButton({ next = '/create' }: { next?: string }) {
  async function signIn() {
    const supabase = createSupabaseBrowserClient();
    const callbackUrl = new URL('/auth/callback', window.location.origin);
    callbackUrl.searchParams.set('next', next);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl.toString() },
    });
  }

  return (
    <button type="button" className="primary-button" onClick={signIn}>
      Masuk dengan Google
    </button>
  );
}
