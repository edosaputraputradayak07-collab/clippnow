import { supabase } from './supabase';
import { buildMobileRequest } from './request';

export type MobileProject = {
  project: {
    id: string;
    name: string;
    status: string;
    format: '9:16' | '1:1' | '16:9';
    start_seconds: number;
    end_seconds: number;
    original_filename: string | null;
    created_at: string;
  };
  job: {
    id: string;
    status: string;
    progress: number;
    error_code: string | null;
    error_message: string | null;
  } | null;
};

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://clippnoww.vercel.app';

async function mobileFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) throw new Error('Sesi login sudah berakhir. Silakan login kembali.');

  const response = await fetch(buildMobileRequest(apiBaseUrl, path, data.session.access_token, init));
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof payload?.error === 'string' ? payload.error : 'Permintaan gagal.');
  return payload as T;
}

export function getSessionUser() {
  return supabase.auth.getUser();
}

export function listProjects() {
  return mobileFetch<{ projects: MobileProject[] }>('/api/mobile/projects');
}

export function createProject(input: {
  name: string;
  original_filename: string;
  source_path: string;
  format: '9:16' | '1:1' | '16:9';
  start_seconds: number;
  end_seconds: number;
}) {
  return mobileFetch<{ project_id: string; job_id: string; credits_remaining: number }>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function startRender(projectId: string) {
  return mobileFetch<{ started: boolean; job_id: string }>(`/api/projects/${encodeURIComponent(projectId)}/render`, {
    method: 'POST',
  });
}

export function getSignedOutput(projectId: string) {
  return mobileFetch<{ url: string }>(`/api/projects/${encodeURIComponent(projectId)}/signed-output`);
}

export function deleteAccount() {
  return mobileFetch<{ deleted: true }>('/api/mobile/account', { method: 'DELETE' });
}
