import type { RenderAspectRatio } from '../engine/render-plan';
import type { VideoWorkflowInput } from './workflow-contract';

export type VideoWorkflowRequest = {
  projectId: string;
  jobId: string;
  userId: string;
  sourcePath: string;
  format: RenderAspectRatio;
  startSeconds: number;
  endSeconds: number;
};

export function buildVideoWorkflowInput(request: VideoWorkflowRequest): VideoWorkflowInput {
  return {
    projectId: request.projectId,
    jobId: request.jobId,
    userId: request.userId,
    sourcePath: request.sourcePath,
    format: request.format,
    startSeconds: request.startSeconds,
    endSeconds: request.endSeconds,
  };
}
