import { describe, expect, it } from 'vitest';
import { getSourceAction } from './source-action';

describe('getSourceAction', () => {
  it('lets a YouTube preview user switch to upload the source video', () => {
    expect(getSourceAction('youtube')).toBe('upload');
  });
});
