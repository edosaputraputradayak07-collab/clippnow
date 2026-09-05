import { describe, expect, it } from 'vitest';
import { normalizeLumiClipProject, buildLumiClipGenerateBody } from './lumiclip';

describe('LumiClip adapter', () => {
  it('builds a YouTube generation request', () => {
    expect(buildLumiClipGenerateBody({
      youtubeUrl: 'https://www.youtube.com/watch?v=abcdefghijk',
      callbackUrl: 'https://example.com/api/youtube/lumiclip/webhook',
    })).toEqual({
      url: 'https://www.youtube.com/watch?v=abcdefghijk',
      callback_url: 'https://example.com/api/youtube/lumiclip/webhook',
    });
  });

  it('normalizes completed clips into the dashboard shape', () => {
    const result = normalizeLumiClipProject({
      id: 'project-1',
      status: 'completed',
      clips: [{
        id: 'clip-1',
        title: 'Strong hook',
        duration: 32.5,
        score: 0.93,
        reason: 'Strong opening',
        download_url: 'https://cdn.example/clip.mp4',
        thumbnail_url: 'https://cdn.example/clip.jpg',
      }],
    });

    expect(result.status).toBe('complete');
    expect(result.videos).toEqual([{
      videoId: 'clip-1',
      videoUrl: 'https://cdn.example/clip.mp4',
      videoMsDuration: 32500,
      title: 'Strong hook',
      viralScore: '0.93',
      viralReason: 'Strong opening',
      thumbnailUrl: 'https://cdn.example/clip.jpg',
    }]);
  });
});
