import { describe, expect, it } from 'vitest';
import { getCreateStudioAction, getCreateStudioStepStates } from './create-studio-action';

describe('getCreateStudioAction', () => {
  it('opens the native picker when no source video is selected', () => {
    expect(getCreateStudioAction({ sourceMode: 'upload', hasFile: false, hasDuration: false, isOwner: true, credits: 0, batchCount: 5, busy: false })).toBe('pick-source');
    expect(getCreateStudioAction({ sourceMode: 'youtube', hasFile: false, hasDuration: false, isOwner: true, credits: 0, batchCount: 5, busy: false })).toBe('pick-source');
  });

  it('starts processing only after a video duration is ready and credits are available', () => {
    expect(getCreateStudioAction({ sourceMode: 'upload', hasFile: true, hasDuration: true, isOwner: true, credits: 0, batchCount: 5, busy: false })).toBe('prepare');
    expect(getCreateStudioAction({ sourceMode: 'upload', hasFile: true, hasDuration: true, isOwner: false, credits: 5, batchCount: 5, busy: false })).toBe('prepare');
  });
});

describe('getCreateStudioStepStates', () => {
  it('marks the four render steps pending before processing starts', () => {
    expect(getCreateStudioStepStates('idle')).toEqual(['pending', 'pending', 'pending', 'pending']);
  });

  it('progresses through transcribe, viral moments, edit, then render', () => {
    expect(getCreateStudioStepStates('transcribe')).toEqual(['active', 'pending', 'pending', 'pending']);
    expect(getCreateStudioStepStates('viral')).toEqual(['done', 'active', 'pending', 'pending']);
    expect(getCreateStudioStepStates('edit')).toEqual(['done', 'done', 'active', 'pending']);
    expect(getCreateStudioStepStates('render')).toEqual(['done', 'done', 'done', 'active']);
    expect(getCreateStudioStepStates('complete')).toEqual(['done', 'done', 'done', 'done']);
  });
});
