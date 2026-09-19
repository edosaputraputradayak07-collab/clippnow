import type { ContentMode, JobStatus } from './types/core';

export type WorkerJob = {
  id: string;
  projectId: string;
  userId: string;
  leaseId: string;
  attempts: number;
  mode: ContentMode;
  inputPath: string;
};

export type WorkerSource = { path: string; durationMs?: number };
export type WorkerTranscript = unknown;
export type WorkerSegment = { id: string; startMs: number; endMs: number; text: string; words: number };
export type WorkerCandidate = { segmentId: string; score: number; reasons: string[]; startMs: number; endMs: number; text: string };
export type WorkerOutput = { segmentId: string; title: string; caption: string; hook: string; startMs?: number; endMs?: number };
export type WorkerRendered = { outputPath: string };
export type WorkerRenderContext = { jobId: string; userId?: string; rank: number };

export type ContentEngineWorkerDeps = {
  claim: () => Promise<WorkerJob | null>;
  renew?: (jobId: string, leaseId: string) => Promise<number>;
  heartbeatIntervalMs?: number;
  stage: (jobId: string, from: JobStatus, to: JobStatus, leaseId: string, progress: number) => Promise<void>;
  fail: (jobId: string, leaseId: string, message: string) => Promise<void>;
  loadSource: (job: WorkerJob) => Promise<WorkerSource>;
  transcribe: (source: WorkerSource) => Promise<WorkerTranscript>;
  segment: (transcript: WorkerTranscript) => WorkerSegment[];
  score: (segments: WorkerSegment[], mode: ContentMode) => WorkerCandidate[];
  generate: (candidates: WorkerCandidate[], transcript: WorkerTranscript, mode: ContentMode) => Promise<WorkerOutput[]>;
  render: (output: WorkerOutput, source: WorkerSource, mode: ContentMode, context?: WorkerRenderContext) => Promise<WorkerRendered>;
  persist: (job: WorkerJob, output: WorkerOutput, rendered: WorkerRendered, rank: number) => Promise<void>;
  consumeCredits: (job: WorkerJob) => Promise<void>;
  releaseCredits: (job: WorkerJob) => Promise<void>;
};

const transition = async (
  deps: ContentEngineWorkerDeps,
  job: WorkerJob,
  from: JobStatus,
  to: JobStatus,
  progress: number,
) => deps.stage(job.id, from, to, job.leaseId, progress);

export async function runContentEngineJob(deps: ContentEngineWorkerDeps): Promise<'IDLE' | 'COMPLETED' | 'FAILED'> {
  const job = await deps.claim();
  if (!job) return 'IDLE';

  try {
    const execute = async () => {
      const source = await deps.loadSource(job);
    await transition(deps, job, 'QUEUED', 'DOWNLOADING', 10);

    const transcript = await deps.transcribe(source);
    await transition(deps, job, 'DOWNLOADING', 'TRANSCRIBING', 30);

    const segments = deps.segment(transcript);
    await transition(deps, job, 'TRANSCRIBING', 'ANALYZING', 45);

    const candidates = deps.score(segments, job.mode);
    await transition(deps, job, 'ANALYZING', 'SELECTING', 60);

    const outputs = await deps.generate(candidates, transcript, job.mode);
    if (outputs.length < 3 || outputs.length > 5) throw new Error('OUTPUT_COUNT_INVALID');
    await transition(deps, job, 'SELECTING', 'GENERATING', 70);

    const rendered: Array<{ output: WorkerOutput; rendered: WorkerRendered; rank: number }> = [];
    for (let index = 0; index < outputs.length; index += 1) {
      const item = outputs[index];
      const result = await deps.render(item, source, job.mode, { jobId: job.id, userId: job.userId, rank: index + 1 });
      rendered.push({ output: item, rendered: result, rank: index + 1 });
    }
    await transition(deps, job, 'GENERATING', 'RENDERING', 90);

    for (const item of rendered) {
      await deps.persist(job, item.output, item.rendered, item.rank);
    }

    await deps.consumeCredits(job);
    await transition(deps, job, 'RENDERING', 'COMPLETED', 100);
      return 'COMPLETED' as const;
    };

    if (deps.renew) {
      const { withWorkerLeaseHeartbeat } = await import('./worker-heartbeat');
      return await withWorkerLeaseHeartbeat(
        execute(),
        () => deps.renew!(job.id, job.leaseId),
        { intervalMs: deps.heartbeatIntervalMs ?? 60_000 },
      );
    }
    return await execute();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'WORKER_UNKNOWN_ERROR';
    await deps.releaseCredits(job);
    await deps.fail(job.id, job.leaseId, message);
    return 'FAILED';
  }
}
