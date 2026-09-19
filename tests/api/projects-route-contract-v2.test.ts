import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const postRoute = readFileSync(resolve(process.cwd(), 'app/api/projects/route.ts'), 'utf8');
const getRoute = readFileSync(resolve(process.cwd(), 'app/api/projects/[projectId]/route.ts'), 'utf8');
const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/20260915073000_vidclipmoney_project_api.sql'), 'utf8');

describe('project API contract v2', () => {
  it('requires auth and validates input', () => {
    expect(postRoute).toContain("AUTH_REQUIRED");
    expect(postRoute).toContain('validateCreateProjectInput');
  });
  it('enforces ownership for both creation idempotency lookup and retrieval', () => {
    expect(postRoute).toContain(".eq('user_id', user.id)");
    expect(getRoute).toContain(".eq('user_id', user.id)");
  });
  it('uses a unique per-user idempotency index', () => {
    expect(migration).toContain('projects_user_id_idempotency_key_uidx');
    expect(migration).toContain('on public.projects(user_id, idempotency_key)');
  });
});
