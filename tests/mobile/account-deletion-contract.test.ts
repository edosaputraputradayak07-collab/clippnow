import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('mobile account deletion contract', () => {
  it('exposes a DELETE endpoint that authenticates the bearer session and uses the server admin client', () => {
    const source = readFileSync(path.join(process.cwd(), 'app/api/mobile/account/route.ts'), 'utf8');
    expect(source).toContain('getMobileUser(request)');
    expect(source).toContain('createAdminClient()');
    expect(source).toContain('auth.admin.deleteUser');
    expect(source).not.toContain('SUPABASE_SECRET_KEY');
  });
});
