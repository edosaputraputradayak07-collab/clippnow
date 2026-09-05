export type CreateStudioAction = 'pick-source' | 'prepare';

export interface CreateStudioActionInput {
  sourceMode: 'upload' | 'youtube';
  hasFile: boolean;
  hasDuration: boolean;
  isOwner: boolean;
  credits: number;
  batchCount: number;
  busy: boolean;
}

export type CreateStudioStepStage = 'idle' | 'transcribe' | 'viral' | 'edit' | 'render' | 'complete';
export type CreateStudioStepState = 'pending' | 'active' | 'done';

export type CreateStudioPrimaryControl = {
  kind: 'picker' | 'process';
  disabled: boolean;
};

export function getCreateStudioAction(input: CreateStudioActionInput): CreateStudioAction {
  if (input.busy) return 'prepare';
  if (!input.hasFile || !input.hasDuration) return 'pick-source';
  if (!input.isOwner && input.credits < input.batchCount) return 'prepare';
  return 'prepare';
}

export function getCreateStudioPrimaryControl(action: CreateStudioAction, busy: boolean): CreateStudioPrimaryControl {
  if (action === 'pick-source') return { kind: 'picker', disabled: busy };
  return { kind: 'process', disabled: busy };
}

export function getCreateStudioStepStates(stage: CreateStudioStepStage): CreateStudioStepState[] {
  const activeIndex: Record<CreateStudioStepStage, number> = {
    idle: -1,
    transcribe: 0,
    viral: 1,
    edit: 2,
    render: 3,
    complete: 4,
  };
  const index = activeIndex[stage];
  return [0, 1, 2, 3].map((step) => step < index ? 'done' : step === index ? 'active' : 'pending');
}
