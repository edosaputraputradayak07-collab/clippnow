import { describe, expect, it } from 'vitest';
import { buildVideoWorkflowInput } from './workflow-request';

describe('buildVideoWorkflowInput', () => {
  it('maps a created project/job into the native workflow payload', () => {
    expect(buildVideoWorkflowInput({
      projectId: 'project-1',
      jobId: 'job-1',
      userId: 'user-1',
      sourcePath: 'user-1/source.mp4',
      format: '9:16',
      startSeconds: 5,
      endSeconds: 35,
    })).toEqual({
      projectId: 'project-1',
      jobId: 'job-1',
      userId: 'user-1',
      sourcePath: 'user-1/source.mp4',
      format: '9:16',
      startSeconds: 5,
      endSeconds: 35,
    });
  });
});
