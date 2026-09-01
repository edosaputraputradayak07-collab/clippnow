import { describe, expect, it } from 'vitest';
import { validateRenderRequest } from '../../lib/rendering/validation';

describe('validateRenderRequest', () => {
  it('accepts each supported render format', () => {
    for (const format of ['9:16', '1:1', '16:9'] as const) {
      const result = validateRenderRequest({
        format,
        start_seconds: 0,
        end_seconds: 30,
      });

      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.format).toBe(format);
    }
  });

  it('accepts a valid clip duration up to ten minutes', () => {
    expect(
      validateRenderRequest({ format: '9:16', start_seconds: 10, end_seconds: 610 }).ok,
    ).toBe(true);
  });

  it('rejects a duration shorter than the minimum', () => {
    const result = validateRenderRequest({
      format: '9:16',
      start_seconds: 10,
      end_seconds: 10.05,
    });

    expect(result.ok).toBe(false);
  });

  it('rejects a duration longer than ten minutes', () => {
    const result = validateRenderRequest({
      format: '9:16',
      start_seconds: 0,
      end_seconds: 600.01,
    });

    expect(result.ok).toBe(false);
  });

  it('rejects non-finite timestamps', () => {
    expect(
      validateRenderRequest({ format: '1:1', start_seconds: Number.NaN, end_seconds: 10 }).ok,
    ).toBe(false);
    expect(
      validateRenderRequest({ format: '1:1', start_seconds: 0, end_seconds: Number.POSITIVE_INFINITY }).ok,
    ).toBe(false);
  });

  it('rejects malformed formats and reversed timestamps', () => {
    expect(
      validateRenderRequest({ format: '4:3', start_seconds: 0, end_seconds: 10 }).ok,
    ).toBe(false);
    expect(
      validateRenderRequest({ format: '16:9', start_seconds: 20, end_seconds: 10 }).ok,
    ).toBe(false);
  });

  it('rejects missing or non-numeric values', () => {
    expect(validateRenderRequest({ format: '9:16' }).ok).toBe(false);
    expect(
      validateRenderRequest({ format: '9:16', start_seconds: '0', end_seconds: 10 }).ok,
    ).toBe(false);
  });
});
