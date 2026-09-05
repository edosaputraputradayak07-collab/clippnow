export type LumiClipVideo = {
  id: string | number;
  title?: string;
  duration?: number;
  score?: number;
  reason?: string;
  download_url?: string;
  thumbnail_url?: string;
};

export type LumiClipProjectResponse = {
  id: string;
  status?: string;
  step?: string;
  expected_clips?: number;
  clips?: LumiClipVideo[];
  message?: string;
};

export type LumiClipCreateResponse = {
  project_id: string;
  status?: string;
  estimated_minutes?: number;
  poll_url?: string;
  message?: string;
};

export type NormalizedLumiClip = {
  status: 'processing' | 'complete';
  project_id: string;
  videos: Array<{
    videoId: string | number;
    videoUrl: string;
    videoMsDuration?: number;
    title?: string;
    viralScore?: string;
    viralReason?: string;
    thumbnailUrl?: string;
  }>;
};

const LUMICLIP_BASE = 'https://api.lumiclip.ai';

export function getLumiClipApiKey(): string {
  const key = process.env.LUMICLIP_API_KEY?.trim();
  if (!key) throw new Error('LUMICLIP_API_KEY belum dikonfigurasi.');
  return key;
}

export function buildLumiClipGenerateBody(input: { youtubeUrl: string; callbackUrl?: string }) {
  return {
    url: input.youtubeUrl,
    ...(input.callbackUrl ? { callback_url: input.callbackUrl } : {}),
  };
}

export async function createLumiClipYouTubeProject(input: { youtubeUrl: string; callbackUrl?: string }): Promise<LumiClipCreateResponse> {
  const response = await fetch(`${LUMICLIP_BASE}/api/v1/clips/generate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getLumiClipApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildLumiClipGenerateBody(input)),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || `LumiClip HTTP ${response.status}`);
  return data as LumiClipCreateResponse;
}

export async function queryLumiClipProject(projectId: string): Promise<LumiClipProjectResponse> {
  const response = await fetch(`${LUMICLIP_BASE}/api/v1/projects/${encodeURIComponent(projectId)}`, {
    headers: { Authorization: `Bearer ${getLumiClipApiKey()}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || `LumiClip HTTP ${response.status}`);
  return data as LumiClipProjectResponse;
}

export function normalizeLumiClipProject(project: LumiClipProjectResponse): NormalizedLumiClip {
  const complete = project.status === 'completed';
  return {
    status: complete ? 'complete' : 'processing',
    project_id: project.id,
    videos: complete ? (project.clips ?? []).map((clip) => ({
      videoId: clip.id,
      videoUrl: clip.download_url ?? '',
      videoMsDuration: typeof clip.duration === 'number' ? Math.round(clip.duration * 1000) : undefined,
      title: clip.title,
      viralScore: typeof clip.score === 'number' ? String(clip.score) : undefined,
      viralReason: clip.reason,
      thumbnailUrl: clip.thumbnail_url,
    })).filter((clip) => clip.videoUrl) : [],
  };
}
