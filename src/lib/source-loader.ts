import { createSupabaseAdminClient } from './supabase/admin';

export const SOURCE_VIDEO_BUCKET = 'source-videos';
export const SOURCE_SIGNED_URL_TTL_SECONDS = 600;

export type SourceLoaderJob = { inputPath: string | null };
export type LoadedSource = { path: string };
export type SourceLoader = (job: SourceLoaderJob) => Promise<LoadedSource>;

export function createSupabaseSourceLoader(
  env: Record<string, string | undefined> = process.env,
): SourceLoader {
  const bucket = env.SOURCE_VIDEO_BUCKET?.trim() || SOURCE_VIDEO_BUCKET;
  const ttl = Number(env.SOURCE_SIGNED_URL_TTL_SECONDS ?? SOURCE_SIGNED_URL_TTL_SECONDS);
  if (!Number.isInteger(ttl) || ttl < 60 || ttl > 3600) {
    throw new Error('SOURCE_SIGNED_URL_TTL_INVALID');
  }

  return async (job) => {
    const inputPath = job.inputPath?.trim();
    if (!inputPath) throw new Error('SOURCE_PATH_REQUIRED');

    const { data, error } = await createSupabaseAdminClient()
      .storage.from(bucket).createSignedUrl(inputPath, ttl);

    if (error || !data?.signedUrl) {
      throw new Error('SOURCE_SIGN_URL_FAILED:' + (error?.message ?? 'missing signed URL'));
    }

    return { path: data.signedUrl };
  };
}
