import { processJob } from '@/worker/render-worker';

async function runRenderStep(jobId: string) {
  'use step';
  await processJob(jobId);
}

export async function startRenderWorkflow(jobId: string) {
  'use workflow';
  await runRenderStep(jobId);
}
