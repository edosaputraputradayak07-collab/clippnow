import { describe, expect, it } from 'vitest';
import { parseVideoWorkflowInput } from './workflow-contract';

describe('video workflow contract', () => {
  it('accepts an owned source path and render details', () => {
    expect(parseVideoWorkflowInput({
      projectId: 'project-1',
      userId: 'user-1',
      sourcePath: 'user-1/source.mp4',
      format: '9:16',
      startSeconds: 12,
      endSeconds: 42,
    })).toEqual({
      projectId: 'project-1',
      userId: 'user-1',
      sourcePath: 'user-1/source.mp4',
      format: '9:16',
      startSeconds: 12,
      endSeconds: 42,
    });
  });

  it('rejects paths that escape the user namespace', () => {
    expect(() => parseVideoWorkflowInput({
      projectId: 'project-1',
      userId: 'user-1',
      sourcePath: 'other-user/source.mp4',
      format: '9:16',
      startSeconds: 0,
      endSeconds: 30,
    })).toThrow(/source path/i);
  });
});
