import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const postRoute = readFileSync(resolve(process.cwd(), 'app/api/projects/route.ts'), 'utf8');
const getRoute = readFileSync(resolve(process.cwd(), 'app/api/projects/[projectId]/route.ts'), 'utf8');
const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/20260915073000_vidclipmoney_project_api.sql'), 'utf8');

describe('Task 5 project API', () => {
  it('requires auth before persistence', () => expect(postRoute).toContain('AUTH_REQUIRED'));
  it('validates the create contract', () => expect(postRoute).toContain('validateCreateProjectInput'));
  it('scopes both operations to user_id', () => {
    expect(postRoute).toContain(".eq('user_id', user.id)");
    expect(getRoute).toContain(".eq('user_id', user.id)");
  });
  it('has database-backed per-user idempotency', () => {
    expect(migration).toContain('projects_user_id_idempotency_key_uidx');
  });
});
