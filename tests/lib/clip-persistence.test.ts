import { describe, expect, it, vi } from 'vitest';
import { createSupabaseClipPersister } from '../../src/lib/clip-persistence';

describe('clip persistence', () => {
  it('persists clip and asset atomically through one RPC', async () => {
    const rpc = vi.fn().mockResolvedValue({ data:'clip-1', error:null });
    const persist = createSupabaseClipPersister(() => ({ rpc }));
    await expect(persist(
      { id:'job-1', projectId:'project-1', userId:'user-1', mode:'educator', leaseId:'lease-1', attempts:1, inputPath:'source.mp4' },
      { segmentId:'seg-1', title:'Judul', caption:'Caption', hook:'Hook', score:91.25, startMs:1000, endMs:31000 },
      { outputPath:'user-1/job-1/clip-1.mp4' }, 1,
    )).resolves.toBeUndefined();
    expect(rpc).toHaveBeenCalledWith('persist_rendered_clip', expect.objectContaining({
      p_project_id:'project-1', p_user_id:'user-1', p_job_id:'job-1',
      p_rank:1, p_ai_score:91.25, p_storage_path:'user-1/job-1/clip-1.mp4',
      p_duration_ms:30000,
    }));
  });

  it('rejects invalid rendered paths before database writes', async () => {
    const rpc = vi.fn();
    const persist = createSupabaseClipPersister(() => ({ rpc }));
    await expect(persist(
      { id:'job-1', projectId:'project-1', userId:'user-1', mode:'educator', leaseId:'lease-1', attempts:1, inputPath:'source.mp4' },
      { segmentId:'seg-1', title:'Judul', caption:'Caption', hook:'Hook', startMs:1000, endMs:31000 },
      { outputPath:'../../private.mp4' }, 1,
    )).rejects.toThrow('CLIP_OUTPUT_PATH_INVALID');
    expect(rpc).not.toHaveBeenCalled();
  });
});
