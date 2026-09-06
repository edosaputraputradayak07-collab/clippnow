export type RenderAspectRatio = '9:16' | '16:9' | '1:1';

export type RenderPlanInput = {
  inputPath: string;
  outputPath: string;
  startSeconds: number;
  endSeconds: number;
  aspectRatio: RenderAspectRatio;
  subtitlesPath?: string;
};

export type RenderPlan = {
  durationSeconds: number;
  args: string[];
};

const DIMENSIONS: Record<RenderAspectRatio, [number, number]> = {
  '9:16': [1080, 1920],
  '16:9': [1920, 1080],
  '1:1': [1080, 1080],
};

function assertSafePath(value: string, name: string): void {
  if (!value || value.includes('\0') || /[\r\n]/.test(value)) {
    throw new Error(`Invalid ${name}.`);
  }
}

function escapeFilterPath(value: string): string {
  return value.replace(/([\\':,\[\]])/g, '\\$1');
}

export function buildRenderPlan(input: RenderPlanInput): RenderPlan {
  assertSafePath(input.inputPath, 'input path');
  assertSafePath(input.outputPath, 'output path');
  if (input.subtitlesPath) assertSafePath(input.subtitlesPath, 'subtitles path');

  if (!Number.isFinite(input.startSeconds) || !Number.isFinite(input.endSeconds) || input.startSeconds < 0 || input.endSeconds <= input.startSeconds) {
    throw new Error('Invalid clip range.');
  }

  const durationSeconds = Number((input.endSeconds - input.startSeconds).toFixed(3));
  const [width, height] = DIMENSIONS[input.aspectRatio];
  const filters = [
    `scale=${width}:${height}:force_original_aspect_ratio=increase`,
    `crop=${width}:${height}`,
  ];

  if (input.subtitlesPath) {
    filters.push(`subtitles=${escapeFilterPath(input.subtitlesPath)}`);
  }

  return {
    durationSeconds,
    args: [
      '-hide_banner',
      '-y',
      '-ss', String(input.startSeconds),
      '-i', input.inputPath,
      '-t', String(durationSeconds),
      '-vf', filters.join(','),
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '20',
      '-c:a', 'aac',
      '-movflags', '+faststart',
      input.outputPath,
    ],
  };
}
