import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createVizardYouTubeProject, queryVizardProject } from './vizard';

describe('vizard adapter', () => {
  beforeEach(() => {
    vi.stubEnv('VIZARDAI_API_KEY', 'test-key');
    vi.restoreAllMocks();
  });

  it('submits a YouTube URL with the YouTube source type', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ code: 2000, projectId: 123 }), { status: 200 }));
    const result = await createVizardYouTubeProject({ youtubeUrl: 'https://www.youtube.com/watch?v=abcdefghijk', clipCount: 5 });
    expect(result.projectId).toBe(123);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/project/create'), expect.objectContaining({ method: 'POST' }));
    const request = fetchMock.mock.calls[0]?.[1];
    expect(JSON.parse(String(request?.body))).toMatchObject({ videoUrl: 'https://www.youtube.com/watch?v=abcdefghijk', videoType: 2, maxClipNumber: 5 });
  });

  it('queries a Vizard project by project id', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ code: 2000, projectId: 123, videos: [] }), { status: 200 }));
    const result = await queryVizardProject(123);
    expect(result.code).toBe(2000);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/project/query/123'), expect.objectContaining({ headers: { VIZARDAI_API_KEY: 'test-key' } }));
  });

  it('fails clearly when the API key is missing', async () => {
    vi.stubEnv('VIZARDAI_API_KEY', '');
    await expect(queryVizardProject(123)).rejects.toThrow('VIZARDAI_API_KEY belum dikonfigurasi.');
  });
});
