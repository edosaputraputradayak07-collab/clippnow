import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('worker runtime database contract', () => {
  it('defines lease columns and service-role worker RPCs', () => {
    const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/20260917040000_vidclipmoney_worker_runtime.sql'), 'utf8');
    expect(migration).toContain('add column if not exists lease_id uuid');
    expect(migration).toContain('add column if not exists leased_until timestamptz');
    expect(migration).toContain('claim_content_engine_job');
    expect(migration).toContain('update_content_engine_stage');
    expect(migration).toContain('fail_content_engine_job');
    expect(migration).toContain("grant execute on function public.claim_content_engine_job(integer) to service_role");
  });
});
