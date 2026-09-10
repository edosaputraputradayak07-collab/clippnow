import path from 'node:path';

export function getYouTubeDlBinaryPath(moduleEntryPath: string, platform = process.platform): string {
  const packageRoot = path.resolve(path.dirname(moduleEntryPath), '..');
  return path.join(packageRoot, 'bin', platform === 'win32' ? 'youtube-dl.exe' : 'yt-dlp');
}
