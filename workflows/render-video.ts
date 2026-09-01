import { runRenderStep } from './render-video-step';

export async function startRenderWorkflow(jobId: string) {
  'use workflow';
  await runRenderStep(jobId);
}
