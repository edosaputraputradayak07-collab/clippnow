import { describe, expect, it } from 'vitest';
import { getResumableUploadEndpoint, shouldUseResumableUpload } from './resumable-upload';

describe('resumable upload contract', () => {
  it('uses resumable uploads above 6 MB', () => {
    expect(shouldUseResumableUpload(6 * 1024 * 1024)).toBe(false);
    expect(shouldUseResumableUpload(6 * 1024 * 1024 + 1)).toBe(true);
  });

  it('uses Supabase direct storage hostname for resumable uploads', () => {
    expect(getResumableUploadEndpoint('https://example.supabase.co')).toBe(
      'https://example.storage.supabase.co/storage/v1/upload/resumable',
    );
  });
});
