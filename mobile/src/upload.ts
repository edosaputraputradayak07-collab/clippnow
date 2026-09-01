import * as tus from 'tus-js-client';
import type { ImagePickerAsset } from 'expo-image-picker';
import { supabase } from './supabase';

const BUCKET = 'clippnow-videos';
const CHUNK_SIZE = 6 * 1024 * 1024;

function getProjectRef() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('EXPO_PUBLIC_SUPABASE_URL is required.');
  return new URL(url).hostname.split('.')[0];
}

export async function uploadVideo(asset: ImagePickerAsset, onProgress?: (percent: number) => void) {
  if (!asset.uri) throw new Error('Video URI tidak tersedia.');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) throw new Error('Sesi login sudah berakhir.');

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error('User tidak ditemukan.');

  const extension = (asset.fileName?.split('.').pop() ?? 'mp4').toLowerCase();
  const path = `${userData.user.id}/${crypto.randomUUID()}.${extension}`;
  const file = { uri: asset.uri, type: asset.mimeType ?? 'video/mp4', name: asset.fileName ?? `clip.${extension}` } as unknown as Blob;
  const endpoint = `https://${getProjectRef()}.storage.supabase.co/storage/v1/upload/resumable`;

  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
        'x-upsert': 'false',
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: BUCKET,
        objectName: path,
        contentType: asset.mimeType ?? 'video/mp4',
        cacheControl: '3600',
      },
      chunkSize: CHUNK_SIZE,
      onError: reject,
      onProgress: (uploadedBytes, totalBytes) => {
        if (totalBytes > 0) onProgress?.(Math.round((uploadedBytes / totalBytes) * 100));
      },
      onSuccess: () => resolve(),
    });
    upload.start();
  });

  return path;
}
