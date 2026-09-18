import { createSupabaseAdminClient } from './supabase/admin';
import type { ContentMode } from './types/core';
import { DEFAULT_WORKER_LEASE_MS } from './worker-runtime';

export type ClaimedContentEngineJob = {
  id: string;
  projectId: string;
  userId: string;
  mode: ContentMode;
  engineStatus: string;
  leaseId: string;
  leasedUntil: number;
  attempts: number;
  inputPath: string | null;
};

type ClaimedRow = {
  id: string;
  project_id: string;
  user_id: string;
  mode: ContentMode;
  engine_status: string;
  lease_id: string;
  leased_until: string;
  attempts: number;
  input_path: string | null;
};

function mapClaimedJob(row: ClaimedRow): ClaimedContentEngineJob {
  if (!row.lease_id || !row.leased_until) {
    throw new Error('WORKER_CLAIM_RESPONSE_INVALID');
  }

  const leasedUntil = Date.parse(row.leased_until);
  if (!Number.isFinite(leasedUntil)) {
    throw new Error('WORKER_CLAIM_RESPONSE_INVALID');
  }

  return {
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    mode: row.mode,
    engineStatus: row.engine_status,
    leaseId: row.lease_id,
    leasedUntil,
    attempts: row.attempts,
    inputPath: row.input_path,
  };
}

export async function claimNextContentEngineJob(
  leaseMs = DEFAULT_WORKER_LEASE_MS,
): Promise<ClaimedContentEngineJob | null> {
  if (!Number.isInteger(leaseMs) || leaseMs <= 0 || leaseMs > 3600000) {
    throw new Error('WORKER_LEASE_INVALID');
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc('claim_content_engine_job', {
    p_lease_ms: leaseMs,
  });

  if (error) {
    throw new Error(`WORKER_CLAIM_FAILED:${error.message}`);
  }

  const rows = (data ?? []) as ClaimedRow[];
  if (rows.length === 0) return null;
  if (rows.length !== 1) throw new Error('WORKER_CLAIM_RESPONSE_INVALID');

  return mapClaimedJob(rows[0]);
}
