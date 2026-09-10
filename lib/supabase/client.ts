import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseConfig } from './config';
import { shouldUseResumableUpload, uploadResumable } from './resumable-upload';

export function createClient() {
  const { url, publishableKey } = getSupabaseConfig();
  const client = createBrowserClient(url, publishableKey);
  const storage = client.storage as any;
  const originalFrom = storage.from.bind(storage);

  storage.from = (bucket: string) => {
    const bucketClient = originalFrom(bucket);
    if (bucket !== 'clippnow-videos') return bucketClient;

    const originalUpload = bucketClient.upload.bind(bucketClient);
    return new Proxy(bucketClient, {
      get(target, property, receiver) {
        if (property !== 'upload') return Reflect.get(target, property, receiver);

        return async (path: string, fileBody: any, options?: any) => {
          if (!fileBody || !shouldUseResumableUpload(Number(fileBody.size))) {
            return originalUpload(path, fileBody, options);
          }

          const { data: { session } } = await client.auth.getSession();
          if (!session?.access_token) {
            return { data: null, error: new Error('Sesi upload tidak tersedia. Silakan login kembali.') };
          }

          try {
            await uploadResumable({
              supabaseUrl: url,
              accessToken: session.access_token,
              bucketName: bucket,
              objectName: path,
              file: fileBody as File,
            });
            return { data: { path }, error: null };
          } catch (error) {
            return {
              data: null,
              error: error instanceof Error ? error : new Error('Upload video gagal.'),
            };
          }
        };
      },
    });
  };

  return client;
}
