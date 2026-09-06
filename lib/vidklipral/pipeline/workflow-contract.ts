export type VideoWorkflowInput = {
  projectId: string;
  userId: string;
  sourcePath: string;
};

export function parseVideoWorkflowInput(input: unknown): VideoWorkflowInput {
  if (!input || typeof input !== 'object') throw new Error('Invalid workflow input.');

  const value = input as Record<string, unknown>;
  const projectId = typeof value.projectId === 'string' ? value.projectId.trim() : '';
  const userId = typeof value.userId === 'string' ? value.userId.trim() : '';
  const sourcePath = typeof value.sourcePath === 'string' ? value.sourcePath.trim() : '';

  if (!projectId || !userId || !sourcePath) throw new Error('Workflow input is incomplete.');
  if (!sourcePath.startsWith(`${userId}/`) || sourcePath.includes('..')) {
    throw new Error('Invalid source path for workflow user.');
  }

  return { projectId, userId, sourcePath };
}
