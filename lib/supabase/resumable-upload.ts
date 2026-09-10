import * as tus from 'tus-js-client';

export const RESUMABLE_UPLOAD_THRESHOLD = 6 * 1024 * 1024;
export const RESUMABLE_UPLOAD_CHUNK_SIZE = 6 * 1024 * 1024;

export function shouldUseResumableUpload(size: number): boolean {
  return Number.isFinite(size) && size > RESUMABLE_UPLOAD_THRESHOLD;
}

export function getResumableUploadEndpoint(supabaseUrl: string): string {
  const url = new URL(supabaseUrl);
  const hostname = url.hostname.endsWith('.supabase.co')
    ? url.hostname.replace(/\.supabase\.co$/, '.storage.supabase.co')
    : url.hostname;
  return `${url.protocol}//${hostname}/storage/v1/upload/resumable`;
}

export interface ResumableUploadInput {
  supabaseUrl: string;
  accessToken: string;
  bucketName: string;
  objectName: string;
  file: File;
  onProgress?: (percentage: number) => void;
}

export async function uploadResumable(input: ResumableUploadInput): Promise<void> {
  if (!input.accessToken) throw new Error('Sesi upload tidak tersedia. Silakan login kembali.');

  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(input.file, {
      endpoint: getResumableUploadEndpoint(input.supabaseUrl),
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: { authorization: `Bearer ${input.accessToken}` },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: RESUMABLE_UPLOAD_CHUNK_SIZE,
      metadata: {
        bucketName: input.bucketName,
        objectName: input.objectName,
        contentType: input.file.type || 'application/octet-stream',
        cacheControl: '3600',
      },
      onError: reject,
      onProgress: (bytesUploaded, bytesTotal) => {
        input.onProgress?.(Math.round((bytesUploaded / bytesTotal) * 100));
      },
      onSuccess: () => resolve(),
    });

    upload
      .findPreviousUploads()
      .then((previousUploads) => {
        if (previousUploads.length > 0) upload.resumeFromPreviousUpload(previousUploads[0]);
        upload.start();
      })
      .catch(reject);
  });
}
