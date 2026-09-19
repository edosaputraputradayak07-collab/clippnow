import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VidClipMoney — 1 Video → Banyak Konten → Banyak Peluang',
  description: 'AI Content Engine untuk mengubah satu video menjadi banyak konten siap pakai.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
