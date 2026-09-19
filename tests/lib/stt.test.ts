import { describe, expect, it, vi } from 'vitest';
import { createHttpTranscriptionProvider } from '../../src/lib/stt';

describe('HTTP transcription provider', () => {
  it('posts the private source URL and maps a valid transcript', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        language: 'id',
        durationMs: 120000,
        utterances: [{
          id: 'u1',
          text: 'Halo dunia',
          startMs: 0,
          endMs: 1200,
          words: [{ text: 'Halo', startMs: 0, endMs: 500 }],
        }],
      }),
    });

    const provider = createHttpTranscriptionProvider({
      STT_API_URL: 'https://stt.example/transcribe',
      STT_API_KEY: 'secret',
    }, fetchImpl);

    await expect(provider.transcribe({
      sourcePath: 'https://storage.example/source.mp4',
      language: 'id',
    })).resolves.toMatchObject({ language: 'id', durationMs: 120000 });

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://stt.example/transcribe',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ authorization: 'Bearer secret' }),
      }),
    );
  });

  it('fails closed when provider configuration is missing', () => {
    expect(() => createHttpTranscriptionProvider({}, fetch)).toThrow(
      'STT_PROVIDER_NOT_CONFIGURED',
    );
  });

  it('rejects malformed provider responses', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ language: '', durationMs: 0, utterances: [] }),
    });
    const provider = createHttpTranscriptionProvider({
      STT_API_URL: 'https://stt.example/transcribe',
      STT_API_KEY: 'secret',
    }, fetchImpl);

    await expect(provider.transcribe({ sourcePath: 'https://storage/source.mp4' }))
      .rejects.toThrow('TRANSCRIPT_LANGUAGE_REQUIRED');
  });
});
