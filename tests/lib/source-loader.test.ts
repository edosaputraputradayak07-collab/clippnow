import { describe, expect, it, vi } from 'vitest';

const createSignedUrl = vi.fn();
vi.mock('../../src/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({
    storage: { from: vi.fn(() => ({ createSignedUrl })) },
  }),
}));

import { createSupabaseSourceLoader } from '../../src/lib/source-loader';

describe('source loader', () => {
  it('creates a short-lived private signed URL for a source object', async () => {
    createSignedUrl.mockResolvedValueOnce({
      data: { signedUrl: 'https://storage.example/source.mp4' },
      error: null,
    });

    const loader = createSupabaseSourceLoader();
    await expect(loader({ inputPath: 'user/project/source.mp4' })).resolves.toEqual({
      path: 'https://storage.example/source.mp4',
    });
    expect(createSignedUrl).toHaveBeenCalledWith('user/project/source.mp4', 600);
  });

  it('fails closed when the source cannot be signed', async () => {
    createSignedUrl.mockResolvedValueOnce({
      data: null,
      error: { message: 'not found' },
    });

    await expect(
      createSupabaseSourceLoader()({ inputPath: 'missing.mp4' }),
    ).rejects.toThrow('SOURCE_SIGN_URL_FAILED:not found');
  });
});
