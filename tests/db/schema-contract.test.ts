import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260915060000_vidclipmoney_content_engine_v1.sql'),
  'utf8',
);

describe('VidClipMoney database schema contract', () => {
  const requiredTables = [
    'transcripts',
    'segments',
    'clip_assets',
    'credit_wallets',
    'credit_ledger',
    'payments',
    'subscriptions',
    'usage_events',
  ];

  it.each(requiredTables)('defines %s', (table) => {
    expect(migration).toMatch(new RegExp(`create table if not exists public\\.${table}\\b`, 'i'));
  });

  it('extends projects, jobs and clips for the five-mode content engine', () => {
    expect(migration).toContain('alter table public.projects');
    expect(migration).toContain('mode');
    expect(migration).toContain('engine_status');
    expect(migration).toContain('ai_score');
  });

  it('protects every user-owned content table with RLS', () => {
    for (const table of ['projects', 'jobs', 'transcripts', 'segments', 'clips', 'clip_assets', 'credit_wallets', 'credit_ledger', 'payments', 'subscriptions', 'usage_events']) {
      expect(migration).toMatch(new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
    }
  });

  it('keeps source and rendered media private', () => {
    expect(migration).toMatch(/insert into storage\.buckets[\\s\\S]*source-videos[\\s\\S]*false/i);
    expect(migration).toMatch(/insert into storage\.buckets[\\s\\S]*rendered-clips[\\s\\S]*false/i);
  });

  it('prevents direct mutation of credits by end users', () => {
    expect(migration).toMatch(/credit_wallets_service_role.*for all.*auth\.role\(\) = 'service_role'/i);
    expect(migration).toMatch(/credit_ledger_service_role.*for all.*auth\.role\(\) = 'service_role'/i);
  });
});
