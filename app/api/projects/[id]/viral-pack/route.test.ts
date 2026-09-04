import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('Viral Pack API security boundary', () => {
  it('requires authentication, ownership, rate limiting and same-origin for web requests', () => {
    const source = readFileSync(path.join(process.cwd(), 'app/api/projects/[id]/viral-pack/route.ts'), 'utf8');
    expect(source).toContain('sameOrigin(request)');
    expect(source).toContain('securityGuard(`viral-pack:');
    expect(source).toContain("eq('user_id', user.id)");
  });

  it('keeps AI/provider credentials server-side', () => {
    const source = readFileSync(path.join(process.cwd(), 'app/api/projects/[id]/viral-pack/route.ts'), 'utf8');
    expect(source).toContain('process.env.OPENAI_API_KEY');
  });
});
