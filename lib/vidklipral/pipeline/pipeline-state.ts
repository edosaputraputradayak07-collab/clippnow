export type PipelineStage = 'queued' | 'analyze' | 'select' | 'render' | 'complete' | 'failed';

type PipelineHistoryEntry = {
  stage: PipelineStage;
  at: string;
};

export type PipelineState = {
  jobId: string;
  stage: PipelineStage;
  history: PipelineHistoryEntry[];
};

const ORDER: Record<Exclude<PipelineStage, 'failed'>, number> = {
  queued: 0,
  analyze: 1,
  select: 2,
  render: 3,
  complete: 4,
};

export function createPipelineState(jobId: string): PipelineState {
  if (!jobId.trim()) throw new Error('Job id is required.');
  const at = new Date().toISOString();
  return { jobId, stage: 'queued', history: [{ stage: 'queued', at }] };
}

export function transitionPipeline(state: PipelineState, nextStage: PipelineStage): PipelineState {
  if (state.stage === 'failed') throw new Error('Cannot transition from failed state.');
  if (nextStage === 'failed') {
    return {
      ...state,
      stage: 'failed',
      history: [...state.history, { stage: 'failed', at: new Date().toISOString() }],
    };
  }

  const currentOrder = ORDER[state.stage];
  const nextOrder = ORDER[nextStage];
  if (nextOrder < currentOrder) throw new Error('Cannot move backwards in pipeline.');
  if (nextOrder > currentOrder + 1) throw new Error('Pipeline stages must advance one step at a time.');
  if (nextStage === state.stage) return state;

  return {
    ...state,
    stage: nextStage,
    history: [...state.history, { stage: nextStage, at: new Date().toISOString() }],
  };
}
