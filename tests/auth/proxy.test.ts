import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Supabase auth proxy boundaries', () => {
  it('does not validate a user session on public auth pages', () => {
    const source = readFileSync(path.join(process.cwd(), 'proxy.ts'), 'utf8');
    expect(source).toContain("const protectedRoute = pathname.startsWith('/dashboard');");
    expect(source).toContain('if (!protectedRoute) return response;');
  });

  it('keeps the refreshed auth cookie response attached to the same request', () => {
    const source = readFileSync(path.join(process.cwd(), 'proxy.ts'), 'utf8');
    expect(source).toContain('response.cookies.set(name, value, options)');
    expect(source).toContain('request.cookies.set(name, value, options)');
  });
});
