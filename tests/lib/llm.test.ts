import { describe, expect, it } from 'vitest';
import { createHttpLLMProvider } from '../../src/lib/llm';

describe('LLM provider', () => {
  it('fails closed when server provider credentials are missing', () => { expect(() => createHttpLLMProvider({})).toThrow('LLM_PROVIDER_NOT_CONFIGURED'); });
});
