export async function runRenderStep(jobId: string) {
  'use step';
  const { processJob } = await import('@/worker/render-worker');
  await processJob(jobId);
}
