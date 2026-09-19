import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const postRoute = readFileSync(resolve(root, 'app/api/projects/route.ts'), 'utf8');
const getRoute = readFileSync(resolve(root, 'app/api/projects/[projectId]/route.ts'), 'utf8');
const migration = readFileSync(resolve(root, 'supabase/migrations/20260915073000_vidclipmoney_project_api.sql'), 'utf8');

describe('project API security contract', () => {
  it('requires authentication before project creation', () => {
    expect(postRoute).toContain("if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });");
  });
  it('scopes reads and writes to the authenticated user', () => {
    expect(postRoute).toContain(".eq('user_id', user.id)");
    expect(getRoute).toContain(".eq('user_id', user.id)");
  });
  it('has a database uniqueness boundary for idempotency', () => {
    expect(migration).toContain('projects_user_id_idempotency_key_uidx');
    expect(migration).toContain('unique index');
  });
});
