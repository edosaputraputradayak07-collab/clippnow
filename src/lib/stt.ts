import { normalizeTranscript, type Transcript, type TranscriptionInput, type TranscriptionProvider } from './transcription';

export function createHttpTranscriptionProvider(
  env: Record<string, string | undefined> = process.env,
  fetchImpl: typeof fetch = fetch,
): TranscriptionProvider {
  const endpoint = env.STT_API_URL;
  const apiKey = env.STT_API_KEY;
  if (!endpoint || !apiKey) throw new Error('STT_PROVIDER_NOT_CONFIGURED');

  return {
    async transcribe(input: TranscriptionInput): Promise<Transcript> {
      if (!input.sourcePath.trim()) throw new Error('STT_SOURCE_REQUIRED');

      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer ' + apiKey,
        },
        body: JSON.stringify({
          sourceUrl: input.sourcePath,
          language: input.language ?? 'id',
          timestamps: true,
          speakers: true,
        }),
        cache: 'no-store',
      });

      if (!response.ok) throw new Error('STT_REQUEST_FAILED:' + response.status);

      const transcript = await response.json() as Transcript;
      return normalizeTranscript(transcript);
    },
  };
}
