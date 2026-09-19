import { CONTENT_MODES, type ContentMode } from '../types/core';

export const PROJECT_SOURCE_TYPES = ['upload', 'youtube'] as const;
export type ProjectSourceType = (typeof PROJECT_SOURCE_TYPES)[number];

export type CreateProjectInput = {
  title?: string;
  mode: ContentMode;
  sourceType: ProjectSourceType;
  sourceUrl?: string;
  sourcePath?: string;
  durationMs?: number;
  originalFilename?: string;
  idempotencyKey: string;
};

export type ProjectActor = { userId: string } | { guestToken: string };

export function validateCreateProjectInput(input: CreateProjectInput): string | null {
  if (!CONTENT_MODES.includes(input.mode)) return 'Invalid content mode';
  if (!PROJECT_SOURCE_TYPES.includes(input.sourceType)) return 'Invalid source type';
  if (!input.idempotencyKey.trim()) return 'Idempotency key is required';
  if (input.sourceType === 'youtube' && !input.sourceUrl?.trim()) return 'YouTube URL is required';
  if (input.sourceType === 'upload' && !input.sourcePath?.trim()) return 'Source path is required';
  if (input.durationMs !== undefined && (!Number.isFinite(input.durationMs) || input.durationMs < 0)) return 'Invalid duration';
  return null;
}

export function projectOwnerFilter(actor: ProjectActor) {
  return 'userId' in actor ? { user_id: actor.userId } : { guest_token: actor.guestToken };
}
