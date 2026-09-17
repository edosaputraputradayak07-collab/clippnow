import { createSupabaseAdminClient } from './supabase/admin';
import { DEFAULT_WORKER_LEASE_MS } from './worker-runtime';
import type { JobStatus } from './types/core';

export type ClaimedWorkerJob = {
  id: string;
  projectId: string;
  userId: string;
  mode: string;
  engineStatus: JobStatus;
  leaseId: string;
  leasedUntil: string;
  attempts: number;
  inputPath: string | null;
};

function mapJob(row: Record<string, unknown>): ClaimedWorkerJob {
  if (typeof row.id !== 'string' || typeof row.project_id !== 'string' || typeof row.user_id !== 'string' || typeof row.lease_id !== 'string') {
    throw new Error('WORKER_JOB_RESPONSE_INVALID');
  }
  if (typeof row.engine_status !== 'string' || typeof row.leased_until !== 'string') {
    throw new Error('WORKER_JOB_RESPONSE_INVALID');
  }
  return {
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    mode: String(row.mode ?? 'affiliate'),
    engineStatus: row.engine_status as JobStatus,
    leaseId: row.lease_id,
    leasedUntil: row.leased_until,
    attempts: Number(row.attempts ?? 0),
    inputPath: typeof row.input_path === 'string' ? row.input_path : null,
  };
}

export async function claimNextContentEngineJob(leaseMs = DEFAULT_WORKER_LEASE_MS): Promise<ClaimedWorkerJob | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc('claim_content_engine_job', { p_lease_ms: leaseMs });
  if (error) throw new Error(`WORKER_CLAIM_FAILED:${error.message}`);
  const rows = Array.isArray(data) ? data : [];
  return rows.length ? mapJob(rows[0] as Record<string, unknown>) : null;
}

export async function advanceContentEngineJob(jobId: string, from: JobStatus, to: JobStatus, leaseId: string): Promise<ClaimedWorkerJob> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc('update_content_engine_stage', {
    p_job_id: jobId,
    p_from: from,
    p_to: to,
    p_lease_id: leaseId,
  });
  if (error) throw new Error(`WORKER_STAGE_FAILED:${error.message}`);
  if (!data || Array.isArray(data)) throw new Error('WORKER_STAGE_RESPONSE_INVALID');
  return mapJob(data as Record<string, unknown>);
}

export async function failContentEngineJob(jobId: string, leaseId: string, errorDetails: Record<string, unknown>): Promise<ClaimedWorkerJob> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc('fail_content_engine_job', {
    p_job_id: jobId,
    p_lease_id: leaseId,
    p_error: errorDetails,
  });
  if (error) throw new Error(`WORKER_FAIL_FAILED:${error.message}`);
  if (!data || Array.isArray(data)) throw new Error('WORKER_FAIL_RESPONSE_INVALID');
  return mapJob(data as Record<string, unknown>);
}
