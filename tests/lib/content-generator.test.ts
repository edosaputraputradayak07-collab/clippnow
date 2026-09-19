import { describe, expect, it, vi } from 'vitest';
import { createModeAwareContentGenerator } from '../../src/lib/content-generator';

describe('mode-aware content generator', () => {
  it('uses the provider for every selected candidate', async () => {
    const provider = {
      generateContentPack: vi.fn()
        .mockResolvedValueOnce({ mode:'affiliate', hook:'h1', title:'t1', caption:'c1', cta:'cta', hashtags:['#a'], angle:'a', rationale:'r' })
        .mockResolvedValueOnce({ mode:'affiliate', hook:'h2', title:'t2', caption:'c2', cta:'cta', hashtags:['#a'], angle:'a', rationale:'r' }),
    };
    const generate = createModeAwareContentGenerator(provider);
    const candidates = [{ id:'s1' }, { id:'s2' }] as any;

    await expect(generate(candidates, 'affiliate')).resolves.toHaveLength(2);
    expect(provider.generateContentPack).toHaveBeenCalledTimes(2);
    expect(provider.generateContentPack).toHaveBeenCalledWith({ candidate:candidates[0], mode:'affiliate' });
  });

  it('rejects providers that return the wrong mode', async () => {
    const provider = {
      generateContentPack: vi.fn().mockResolvedValue({
        mode:'podcast', hook:'h', title:'t', caption:'c', cta:'cta', hashtags:['#p'], angle:'a', rationale:'r',
      }),
    };
    await expect(
      createModeAwareContentGenerator(provider)([{ id:'s1' }] as any, 'educator'),
    ).rejects.toThrow('CONTENT_PACK_MODE_MISMATCH');
  });
});
