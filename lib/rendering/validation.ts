import type { RenderFormat, RenderRequest, ValidatedRenderRequest } from './types';

export const MIN_RENDER_SECONDS = 0.1;
export const MAX_RENDER_SECONDS = 60 * 10;

const FORMATS: readonly RenderFormat[] = ['9:16', '1:1', '16:9'];

type ValidationResult =
  | { ok: true; value: ValidatedRenderRequest }
  | { ok: false; error: string };

export function validateRenderRequest(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Render request must be an object.' };
  }

  const value = input as Partial<RenderRequest>;

  if (typeof value.format !== 'string' || !FORMATS.includes(value.format as RenderFormat)) {
    return { ok: false, error: 'Format tidak valid.' };
  }

  if (typeof value.start_seconds !== 'number' || typeof value.end_seconds !== 'number') {
    return { ok: false, error: 'Timestamp harus berupa angka.' };
  }

  if (!Number.isFinite(value.start_seconds) || !Number.isFinite(value.end_seconds)) {
    return { ok: false, error: 'Timestamp harus berupa angka finite.' };
  }

  if (value.start_seconds < 0 || value.end_seconds <= value.start_seconds) {
    return { ok: false, error: 'Rentang waktu tidak valid.' };
  }

  const duration_seconds = value.end_seconds - value.start_seconds;
  if (duration_seconds < MIN_RENDER_SECONDS || duration_seconds > MAX_RENDER_SECONDS) {
    return {
      ok: false,
      error: 'Durasi clip harus minimal 0,1 detik dan maksimal 10 menit.',
    };
  }

  return {
    ok: true,
    value: {
      format: value.format as RenderFormat,
      start_seconds: value.start_seconds,
      end_seconds: value.end_seconds,
      duration_seconds,
    },
  };
}
