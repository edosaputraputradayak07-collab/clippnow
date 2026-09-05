export type VizardClip = {
  videoId: number | string;
  videoUrl: string;
  videoMsDuration?: number;
  title?: string;
  transcript?: string;
  viralScore?: string;
  viralReason?: string;
  clipEditorUrl?: string;
};

export type VizardCreateResponse = {
  code: number;
  projectId?: number | string;
  shareLink?: string;
  errMsg?: string;
};

export type VizardQueryResponse = {
  code: number;
  projectId?: number | string;
  projectName?: string;
  shareLink?: string;
  videos?: VizardClip[];
};

const VIZARD_BASE = 'https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project';

export function getVizardApiKey(): string {
  const key = process.env.VIZARDAI_API_KEY?.trim();
  if (!key) throw new Error('VIZARDAI_API_KEY belum dikonfigurasi.');
  return key;
}

export async function createVizardYouTubeProject(input: {
  youtubeUrl: string;
  language?: string;
  clipCount?: number;
  projectName?: string;
  keywords?: string;
}): Promise<VizardCreateResponse> {
  const response = await fetch(`${VIZARD_BASE}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', VIZARDAI_API_KEY: getVizardApiKey() },
    body: JSON.stringify({
      lang: input.language ?? 'auto',
      preferLength: [2],
      videoUrl: input.youtubeUrl,
      videoType: 2,
      maxClipNumber: input.clipCount ?? 5,
      projectName: input.projectName?.slice(0, 120) || 'Vidklipral YouTube import',
      keywords: input.keywords?.slice(0, 500),
      subtitleSwitch: 1,
      headlineSwitch: 1,
      emojiSwitch: 0,
      highlightSwitch: 1,
      autoBrollSwitch: 0,
      clipModel: 'clip_v2',
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Vizard HTTP ${response.status}`);
  return data as VizardCreateResponse;
}

export async function queryVizardProject(projectId: string | number): Promise<VizardQueryResponse> {
  const response = await fetch(`${VIZARD_BASE}/query/${encodeURIComponent(String(projectId))}`, {
    headers: { VIZARDAI_API_KEY: getVizardApiKey() },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Vizard HTTP ${response.status}`);
  return data as VizardQueryResponse;
}
