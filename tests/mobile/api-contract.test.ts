import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(path.join(process.cwd(), file), 'utf8');

describe('mobile API boundaries', () => {
  it('keeps the session endpoint minimal and bearer-authenticated', () => {
    const source = read('app/api/mobile/session/route.ts');
    expect(source).toContain('getMobileUser(request)');
    expect(source).toContain('context.user.id');
    expect(source).not.toContain('SUPABASE_SECRET_KEY');
  });

  it('does not expose private storage paths in the mobile project list', () => {
    const source = read('app/api/mobile/projects/route.ts');
    expect(source).toContain("select('id,name,status,format,start_seconds,end_seconds,created_at,updated_at')");
    expect(source).not.toContain('output_path');
    expect(source).toContain('getMobileUser(request)');
  });

  it('keeps mobile auth on Authorization headers rather than query parameters', () => {
    const source = read('lib/auth/mobile-request.ts');
    expect(source).toContain("request.headers.get('authorization')");
    expect(source).not.toContain('searchParams');
  });
});
