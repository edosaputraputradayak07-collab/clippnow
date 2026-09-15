export const SOURCE_VIDEO_BUCKET = 'source-videos';
export const MAX_SOURCE_VIDEO_BYTES = 500 * 1024 * 1024;
export const SOURCE_VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'] as const;

export type SourceVideoMimeType = (typeof SOURCE_VIDEO_MIME_TYPES)[number];

export function isSourceVideoMimeType(value: string): value is SourceVideoMimeType {
  return (SOURCE_VIDEO_MIME_TYPES as readonly string[]).includes(value);
}

export function validateSourceVideo(input: { contentType: string; size: number }): string | null {
  if (!isSourceVideoMimeType(input.contentType)) return 'UNSUPPORTED_VIDEO_TYPE';
  if (!Number.isFinite(input.size) || input.size <= 0) return 'INVALID_VIDEO_SIZE';
  if (input.size > MAX_SOURCE_VIDEO_BYTES) return 'VIDEO_TOO_LARGE';
  return null;
}

export function sanitizeFilename(filename: string): string {
  const basename = filename.trim().split(/[\\/]/).pop() ?? '';
  const normalized = basename.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^[.-]+/, '');
  return normalized.slice(0, 120) || 'video';
}

export function buildSourcePath(userId: string, projectId: string, filename: string, nonce: string): string {
  return `${userId}/${projectId}/${nonce}-${sanitizeFilename(filename)}`;
}
