import { describe, expect, it } from 'vitest';
import { buildFfmpegArgs } from './ffmpeg';

describe('buildFfmpegArgs', () => {
  it('uses a duration-aware smooth crop for motion zoom', () => {
    const args = buildFfmpegArgs({ sourcePath: '/tmp/source.mp4', outputPath: '/tmp/output.mp4', startSeconds: 2, durationSeconds: 30, format: '9:16', effects: ['motion-zoom'] });
    const filter = args[args.indexOf('-vf') + 1];
    expect(filter).toContain("crop=w='iw/(1+0.08*min(t/30,1))'");
    expect(filter).not.toContain('zoompan');
  });

  it('keeps motion zoom after punch-in without resetting the timeline', () => {
    const args = buildFfmpegArgs({ sourcePath: '/tmp/source.mp4', outputPath: '/tmp/output.mp4', startSeconds: 5, durationSeconds: 12, format: '1:1', effects: ['motion-zoom'], punchIns: [{ start: 2, end: 4, strength: 'strong' }] });
    const filter = args[args.indexOf('-vf') + 1];
    expect(filter).toContain('between(t,2,4)');
    expect(filter).toContain("min(t/12,1)");
    expect(filter.indexOf('between(t,2,4)')).toBeLessThan(filter.lastIndexOf("min(t/12,1)"));
  });

  it('adds visible short-form enhancement filters for viral edits', () => {
    const args = buildFfmpegArgs({ sourcePath: '/tmp/source.mp4', outputPath: '/tmp/output.mp4', startSeconds: 2, durationSeconds: 30, format: '9:16', effects: ['motion-zoom', 'beat-flash', 'impact-shake', 'jump-cut'] });
    const filter = args[args.indexOf('-vf') + 1];
    expect(filter).toContain('eq=contrast=1.08:saturation=1.12');
    expect(filter).toContain('brightness=');
    expect(filter).toContain('unsharp=');
  });

  it('adds bounded punch-in crop instructions for viral moments', () => {
    const args = buildFfmpegArgs({ sourcePath: '/tmp/source.mp4', outputPath: '/tmp/output.mp4', startSeconds: 0, durationSeconds: 20, format: '9:16', punchIns: [{ start: 0, end: 2, strength: 'strong' }, { start: 8, end: 10, strength: 'medium' }] });
    const filter = args[args.indexOf('-vf') + 1];
    expect(filter).toContain('crop=');
    expect(filter).toContain('between(t,0,2)');
    expect(filter).toContain('between(t,8,10)');
  });
});
