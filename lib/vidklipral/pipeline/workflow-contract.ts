import type { RenderAspectRatio } from '../engine/render-plan';

export type VideoWorkflowInput = {
  projectId: string;
  userId: string;
  sourcePath: string;
  format: RenderAspectRatio;
  startSeconds: number;
  endSeconds: number;
};

const FORMATS = new Set<RenderAspectRatio>(['9:16', '1:1', '16:9']);

export function parseVideoWorkflowInput(input: unknown): VideoWorkflowInput {
  if (!input || typeof input !== 'object') throw new Error('Invalid workflow input.');

  const value = input as Record<string, unknown>;
  const projectId = typeof value.projectId === 'string' ? value.projectId.trim() : '';
  const userId = typeof value.userId === 'string' ? value.userId.trim() : '';
  const sourcePath = typeof value.sourcePath === 'string' ? value.sourcePath.trim() : '';
  const format = typeof value.format === 'string' ? value.format as RenderAspectRatio : null;
  const startSeconds = typeof value.startSeconds === 'number' ? value.startSeconds : NaN;
  const endSeconds = typeof value.endSeconds === 'number' ? value.endSeconds : NaN;

  if (!projectId || !userId || !sourcePath) throw new Error('Workflow input is incomplete.');
  if (!sourcePath.startsWith(`${userId}/`) || sourcePath.includes('..')) {
    throw new Error('Invalid source path for workflow user.');
  }
  if (!format || !FORMATS.has(format)) throw new Error('Invalid render format.');
  if (!Number.isFinite(startSeconds) || !Number.isFinite(endSeconds) || startSeconds < 0 || endSeconds <= startSeconds || endSeconds - startSeconds > 600) {
    throw new Error('Invalid render range.');
  }

  return { projectId, userId, sourcePath, format, startSeconds, endSeconds };
}
