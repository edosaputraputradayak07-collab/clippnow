import { describe, expect, it } from 'vitest';
import { getCreateStudioAction } from './create-studio-action';

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
