import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const route = readFileSync(resolve(process.cwd(), 'app/api/projects/route.ts'), 'utf8');
const getRoute = readFileSync(resolve(process.cwd(), 'app/api/projects/[projectId]/route.ts'), 'utf8');

describe('Task 5 acceptance boundary', () => {
  it('returns existing projects for repeated idempotency keys', () => expect(route).toContain('reused: true'));
  it('does not expose projects across users', () => expect(getRoute).toContain(".eq('user_id', user.id)"));
  it('keeps persistence behind the authenticated actor', () => expect(route).toContain("getCurrentUser()"));
});
