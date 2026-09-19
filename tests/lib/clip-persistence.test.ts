import { describe, expect, it, vi } from 'vitest';
import { createSupabaseClipPersister } from '../../src/lib/clip-persistence';

describe('clip persistence', () => {
  it('persists clip metadata and rendered asset with one deterministic rank key', async () => {
    const insertClip = vi.fn().mockResolvedValue({
      data: { id:'clip-1' }, error:null,
    });
    const insertAsset = vi.fn().mockResolvedValue({ data:{ id:'asset-1' }, error:null });
    const insertClipCall = vi.fn(() => ({ select: vi.fn(() => ({ single: insertClip })) }));
    const client = {
      from: vi.fn((table:string) => table === 'clips'
        ? { insert: insertClipCall }
        : { insert: insertAsset }),
    };
    const persist = createSupabaseClipPersister(() => client as any);
    await expect(persist(
      { id:'job-1', projectId:'project-1', userId:'user-1', mode:'educator', leaseId:'lease-1', attempts:1, inputPath:'source.mp4' },
      { segmentId:'seg-1', title:'Judul', caption:'Caption', hook:'Hook', score:91.25, startMs:1000, endMs:31000 },
      { outputPath:'user-1/job-1/clip-1.mp4' },
      1,
    )).resolves.toBeUndefined();
    expect(insertClipCall).toHaveBeenCalledWith(expect.objectContaining({ ai_score:91.25 }));
    expect(insertAsset).toHaveBeenCalledWith(expect.objectContaining({
      clip_id:'clip-1', project_id:'project-1', user_id:'user-1', kind:'video',
      storage_path:'user-1/job-1/clip-1.mp4', mime_type:'video/mp4',
    }));
  });

  it('rejects invalid rendered paths before database writes', async () => {
    const client = { from: vi.fn() };
    const persist = createSupabaseClipPersister(() => client as any);
    await expect(persist(
      { id:'job-1', projectId:'project-1', userId:'user-1', mode:'educator', leaseId:'lease-1', attempts:1, inputPath:'source.mp4' },
      { segmentId:'seg-1', title:'Judul', caption:'Caption', hook:'Hook', startMs:1000, endMs:31000 },
      { outputPath:'../../private.mp4' }, 1,
    )).rejects.toThrow('CLIP_OUTPUT_PATH_INVALID');
    expect(client.from).not.toHaveBeenCalled();
  });
});
