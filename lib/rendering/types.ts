export type RenderFormat = '9:16' | '1:1' | '16:9';

export type RenderJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface RenderRequest {
  format: RenderFormat;
  start_seconds: number;
  end_seconds: number;
}

export interface ValidatedRenderRequest extends RenderRequest {
  duration_seconds: number;
}
