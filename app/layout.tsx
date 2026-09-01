import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClippNow — AI Video Clip Studio',
  description: 'Ubah video panjang menjadi konten pendek dengan ClippNow.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
