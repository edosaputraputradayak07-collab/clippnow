import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ResultsPage from '../../app/results/page';

describe('results page', () => {
  it('shows generated clips with score, preview and download actions', () => {
    const html = renderToStaticMarkup(React.createElement(ResultsPage));
    expect(html).toContain('Hasil Konten');
    expect(html).toContain('AI Score');
    expect(html).toContain('Preview');
    expect(html).toContain('Download');
    expect(html).toContain('Buat Konten Lagi');
  });
});
