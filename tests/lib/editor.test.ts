import { describe, expect, it } from 'vitest';
import { serializeEditorState, toggleCaptions, updateCopy, updateTrim, validateEditorState, type EditorState } from '../../src/lib/editor';

const baseState: EditorState = {
  clipId: 'clip-1',
  startMs: 1000,
  endMs: 31000,
  captionsEnabled: true,
  content: { hook: 'Ini hook', title: 'Judul', caption: 'Caption', cta: 'Coba sekarang', hashtags: ['#tips'] },
};

describe('lightweight editor contract', () => {
  it('accepts a valid state and serializes it', () => {
    expect(validateEditorState(baseState)).toBeNull();
    expect(JSON.parse(serializeEditorState(baseState))).toEqual(baseState);
  });

  it('rejects invalid trim ranges', () => {
    expect(() => updateTrim(baseState, 5000, 5000)).toThrow('EDITOR_INVALID:END_INVALID');
    expect(() => updateTrim(baseState, -1, 5000)).toThrow('EDITOR_INVALID:START_INVALID');
  });

  it('updates copy without losing other fields', () => {
    const next = updateCopy(baseState, { title: 'Judul baru' });
    expect(next.content.title).toBe('Judul baru');
    expect(next.content.caption).toBe(baseState.content.caption);
  });

  it('toggles captions without mutating the source', () => {
    const next = toggleCaptions(baseState);
    expect(next.captionsEnabled).toBe(false);
    expect(baseState.captionsEnabled).toBe(true);
  });
});
