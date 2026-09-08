export function parseMediaDuration(output: string): number {
  const match = output.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/i);
  if (!match) throw new Error('Media duration unavailable');

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const duration = hours * 3600 + minutes * 60 + seconds;
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Media duration unavailable');
  return duration;
}
