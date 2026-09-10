import { describe, expect, it } from 'vitest';
import { getYouTubeDlBinaryPath } from './youtube-runtime';

describe('getYouTubeDlBinaryPath', () => {
  it('resolves the bundled unix yt-dlp binary from the package entrypoint', () => {
    expect(getYouTubeDlBinaryPath('/var/task/node_modules/youtube-dl-exec/src/index.js', 'linux')).toBe('/var/task/node_modules/youtube-dl-exec/bin/yt-dlp');
  });

  it('resolves the Windows executable when the runtime is win32', () => {
    expect(getYouTubeDlBinaryPath('C:/app/node_modules/youtube-dl-exec/src/index.js', 'win32')).toBe('C:/app/node_modules/youtube-dl-exec/bin/youtube-dl.exe');
  });
});
