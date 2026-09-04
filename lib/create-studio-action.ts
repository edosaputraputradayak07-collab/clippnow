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

export function getCreateStudioAction(input: CreateStudioActionInput): CreateStudioAction {
  if (input.busy) return 'prepare';
  if (!input.hasFile || !input.hasDuration) return 'pick-source';
  if (!input.isOwner && input.credits < input.batchCount) return 'prepare';
  return 'prepare';
}
