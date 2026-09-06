import { describe, expect, it } from 'vitest';
import { createPipelineState, transitionPipeline, type PipelineStage } from './pipeline-state';

describe('Vidklipral pipeline state', () => {
  it('starts queued and advances one stage at a time', () => {
    let state = createPipelineState('job-1');
    expect(state.stage).toBe('queued');

    const stages: PipelineStage[] = ['analyze', 'select', 'render', 'complete'];
    for (const stage of stages) state = transitionPipeline(state, stage);

    expect(state.stage).toBe('complete');
    expect(state.history.map((entry) => entry.stage)).toEqual(['queued', ...stages]);
  });

  it('does not allow moving backwards or completing from failed state', () => {
    const state = transitionPipeline(createPipelineState('job-1'), 'analyze');

    expect(() => transitionPipeline(state, 'queued')).toThrow(/backwards/i);
    expect(() => transitionPipeline({ ...state, stage: 'failed' }, 'complete')).toThrow(/failed/i);
  });
});
