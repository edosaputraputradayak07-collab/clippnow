import { describe, expect, it } from 'vitest';
import { buildSourcePath, MAX_SOURCE_VIDEO_BYTES, sanitizeFilename, validateSourceVideo } from '../../src/lib/media';

describe('source media contract', () => {
  it('accepts supported video types within the 500 MB limit', () => {
    expect(validateSourceVideo({ contentType: 'video/mp4', size: 1024 })).toBeNull();
    expect(validateSourceVideo({ contentType: 'video/quicktime', size: MAX_SOURCE_VIDEO_BYTES })).toBeNull();
    expect(validateSourceVideo({ contentType: 'video/webm', size: 1024 })).toBeNull();
  });

  it('rejects unsupported types and oversized files', () => {
    expect(validateSourceVideo({ contentType: 'video/mkv', size: 1024 })).toBe('UNSUPPORTED_VIDEO_TYPE');
    expect(validateSourceVideo({ contentType: 'video/mp4', size: MAX_SOURCE_VIDEO_BYTES + 1 })).toBe('VIDEO_TOO_LARGE');
    expect(validateSourceVideo({ contentType: 'video/mp4', size: 0 })).toBe('INVALID_VIDEO_SIZE');
  });

  it('sanitizes filenames and scopes paths by user and project', () => {
    expect(sanitizeFilename('../my video!!.mp4')).toBe('my-video-.mp4');
    expect(buildSourcePath('user-1', 'project-1', 'video.mp4', 'nonce')).toBe('user-1/project-1/nonce-video.mp4');
  });
});
