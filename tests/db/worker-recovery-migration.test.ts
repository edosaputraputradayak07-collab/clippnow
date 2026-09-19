import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260918030000_vidclipmoney_worker_recovery_hardening.sql'),
  'utf8',
);

describe('worker recovery migration contract', () => {
  it('persists progress and reclaims stale processing jobs', () => {
    expect(migration).toContain('add column if not exists progress numeric not null default 0');
    expect(migration).toContain("j.status in ('queued','processing')");
    expect(migration).toContain('j.leased_until <= now()');
    expect(migration).toContain("status='processing'");
  });

  it('keeps failure separate from normal stage transitions', () => {
    expect(migration).toContain("p_to_status = 'FAILED'");
    expect(migration).toContain('USE_FAIL_CONTENT_ENGINE_JOB');
    expect(migration).toContain("engine_status='FAILED'");
    expect(migration).toContain("status='failed'");
  });
});