import { describe, expect, it } from 'vitest';
import { buildFFmpegCommand } from '../../src/lib/ffmpeg';
import { buildRenderPlan } from '../../src/lib/render-plan';

describe('ffmpeg adapter', () => {
  it('builds a constrained 9:16 H264/AAC command', () => { const plan = buildRenderPlan({ clipId: 'c1', sourcePath: 'u/p/source.mp4', startMs: 1000, endMs: 31000, captionText: 'Halo: ini clip', outputPath: 'u/p/clip.mp4' }); const command = buildFFmpegCommand(plan); expect(command.executable).toBe('ffmpeg'); expect(command.args).toContain('h264'); expect(command.args).toContain('aac'); expect(command.args.join(' ')).toContain('scale=1080:1920'); expect(command.args.join(' ')).toContain('Halo\\: ini clip'); });
});
