import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ResultsView, type ResultClip } from '../../app/results/page';

const sample: ResultClip[] = [{ id: '1', title: 'Clip contoh', score: 86, duration: '00:35', reason: 'Hook kuat', preview: '/preview/1', download: '/download/1' }];

describe('results page', () => {
  it('shows generated clips with score, preview and download actions', () => {
    const html = renderToStaticMarkup(React.createElement(ResultsView, { clips: sample }));
    expect(html).toContain('Hasil Konten');
    expect(html).toContain('AI Score');
    expect(html).toContain('Preview');
    expect(html).toContain('Download');
    expect(html).toContain('Buat Konten Lagi');
  });
  it('shows a useful empty state when processing has no clips yet', () => {
    const html = renderToStaticMarkup(React.createElement(ResultsView, { clips: [] }));
    expect(html).toContain('Belum ada clip');
  });
});
