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
  if (!row.lease_id || !row.leased_until) throw new Error('WORKER_CLAIM_RESPONSE_INVALID');
  const leasedUntil = Date.parse(row.leased_until);
  if (!Number.isFinite(leasedUntil)) throw new Error('WORKER_CLAIM_RESPONSE_INVALID');

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
  const { data, error } = await createSupabaseAdminClient().rpc('claim_content_engine_job', {
    p_lease_ms: leaseMs,
  });
  if (error) throw new Error(`WORKER_CLAIM_FAILED:${error.message}`);
  const rows = (data ?? []) as ClaimedRow[];
  if (rows.length === 0) return null;
  if (rows.length !== 1) throw new Error('WORKER_CLAIM_RESPONSE_INVALID');
  return mapClaimedJob(rows[0]);
}

export async function updateContentEngineStage(
  jobId: string,
  fromStatus: string,
  toStatus: string,
  leaseId: string,
  progress: number,
): Promise<void> {
  if (!jobId.trim() || !leaseId.trim()) throw new Error('WORKER_STAGE_INPUT_INVALID');
  if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
    throw new Error('WORKER_PROGRESS_INVALID');
  }

  const { data, error } = await createSupabaseAdminClient().rpc('update_content_engine_stage', {
    p_job_id: jobId,
    p_from_status: fromStatus,
    p_to_status: toStatus,
    p_lease_id: leaseId,
    p_progress: progress,
  });
  if (error) throw new Error(`WORKER_STAGE_UPDATE_FAILED:${error.message}`);
  if (!Array.isArray(data) || data.length !== 1 || data[0]?.updated !== true) {
    throw new Error('WORKER_STAGE_OWNERSHIP_LOST');
  }
}

export async function failContentEngineJob(
  jobId: string,
  leaseId: string,
  errorDetails: string,
): Promise<void> {
  if (!jobId.trim() || !leaseId.trim() || !errorDetails.trim()) {
    throw new Error('WORKER_FAILURE_INPUT_INVALID');
  }

  const { data, error } = await createSupabaseAdminClient().rpc('fail_content_engine_job', {
    p_job_id: jobId,
    p_lease_id: leaseId,
    p_error: { message: errorDetails },
  });
  if (error) throw new Error(`WORKER_FAILURE_UPDATE_FAILED:${error.message}`);
  if (!Array.isArray(data) || data.length !== 1 || data[0]?.updated !== true) {
    throw new Error('WORKER_FAILURE_OWNERSHIP_LOST');
  }
}
export async function renewContentEngineLease(
  jobId: string,
  leaseId: string,
  leaseMs = DEFAULT_WORKER_LEASE_MS,
): Promise<number> {
  if (!jobId.trim() || !leaseId.trim()) throw new Error('WORKER_LEASE_INPUT_INVALID');
  if (!Number.isInteger(leaseMs) || leaseMs <= 0 || leaseMs > 3600000) {
    throw new Error('WORKER_LEASE_INVALID');
  }

  const { data, error } = await createSupabaseAdminClient().rpc('renew_content_engine_lease', {
    p_job_id: jobId,
    p_lease_id: leaseId,
    p_lease_ms: leaseMs,
  });
  if (error) throw new Error(`WORKER_LEASE_RENEW_FAILED:${error.message}`);

  if (!Array.isArray(data) || data.length !== 1 || data[0]?.renewed !== true) {
    throw new Error('WORKER_LEASE_OWNERSHIP_LOST');
  }

  const leasedUntil = Date.parse(data[0].leased_until);
  if (!Number.isFinite(leasedUntil)) throw new Error('WORKER_LEASE_RESPONSE_INVALID');
  return leasedUntil;
}
