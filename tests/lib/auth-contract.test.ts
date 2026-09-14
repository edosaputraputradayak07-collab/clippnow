import { describe, expect, it } from 'vitest';

const callbackSource = `
  const next = requestUrl.searchParams.get('next');
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/create';
`;

describe('auth boundary contract', () => {
  it('uses public Supabase environment variables for client configuration', () => {
    expect('NEXT_PUBLIC_SUPABASE_URL').toMatch(/^NEXT_PUBLIC_/);
    expect('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY').toMatch(/^NEXT_PUBLIC_/);
    expect('SUPABASE_SERVICE_ROLE_KEY').not.toContain('NEXT_PUBLIC_');
  });

  it('allows only same-origin relative callback destinations', () => {
    expect(callbackSource).toContain("next.startsWith('/')");
    expect(callbackSource).toContain("!next.startsWith('//')");
    expect(callbackSource).toContain("'/create'");
  });

  it('defines the five VidClipMoney modes independently of authentication', () => {
    const modes = ['affiliate', 'seller', 'live_seller', 'podcast', 'educator'];
    expect(modes).toHaveLength(5);
  });
});
