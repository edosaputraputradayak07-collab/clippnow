import { describe, expect, it } from 'vitest';
import { buildRenderPlan } from './render-plan';

describe('native render plan', () => {
  it('builds a vertical render with trimmed duration and subtitles', () => {
    const plan = buildRenderPlan({
      inputPath: '/tmp/source.mp4',
      outputPath: '/tmp/clip.mp4',
      startSeconds: 12.5,
      endSeconds: 42.5,
      aspectRatio: '9:16',
      subtitlesPath: '/tmp/captions.srt',
    });

    expect(plan.durationSeconds).toBe(30);
    expect(plan.args).toContain('-ss');
    expect(plan.args).toContain('12.5');
    expect(plan.args).toContain('-t');
    expect(plan.args).toContain('30');
    expect(plan.args.join(' ')).toContain('scale=1080:1920');
    expect(plan.args.join(' ')).toContain('subtitles=/tmp/captions.srt');
    expect(plan.args.at(-1)).toBe('/tmp/clip.mp4');
  });

  it('rejects invalid clip ranges', () => {
    expect(() => buildRenderPlan({
      inputPath: '/tmp/source.mp4',
      outputPath: '/tmp/clip.mp4',
      startSeconds: 50,
      endSeconds: 40,
      aspectRatio: '9:16',
    })).toThrow(/invalid clip range/i);
  });
});
