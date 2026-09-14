import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ModePicker } from '../../../components/create/mode-picker';

describe('ModePicker', () => {
  it('renders all five required AI modes', () => {
    const html = renderToStaticMarkup(<ModePicker value="affiliate" onChange={() => undefined} />);
    expect(html).toContain('TikTok Affiliate');
    expect(html).toContain('Seller / UMKM');
    expect(html).toContain('Live Seller');
    expect(html).toContain('Podcaster');
    expect(html).toContain('Educator / Personal Brand');
  });

  it('marks the selected mode and exposes accessible buttons', () => {
    const html = renderToStaticMarkup(<ModePicker value="podcast" onChange={() => undefined} />);
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-label="Pilih mode Podcaster"');
  });
});
