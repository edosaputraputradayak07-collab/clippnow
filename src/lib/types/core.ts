export const CONTENT_MODES = ['affiliate', 'seller', 'live_seller', 'podcast', 'educator'] as const;
export type ContentMode = (typeof CONTENT_MODES)[number];

export const JOB_STATUSES = [
  'QUEUED',
  'DOWNLOADING',
  'TRANSCRIBING',
  'ANALYZING',
  'SELECTING',
  'GENERATING',
  'RENDERING',
  'COMPLETED',
  'FAILED',
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export type ModeConfig = {
  id: ContentMode;
  label: string;
  description: string;
  signals: readonly string[];
};
