import { describe, expect, it } from 'vitest';
import { createHttpRenderProvider } from '../../src/lib/render-provider';

describe('render provider', () => {
  it('fails closed when worker credentials are missing', () => { expect(() => createHttpRenderProvider({})).toThrow('RENDER_PROVIDER_NOT_CONFIGURED'); });
});
