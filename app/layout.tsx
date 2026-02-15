import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@/lib/env-check'; // Validate environment variables on startup

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Jekyll CMS Panel',
  description: 'Personal CMS for Jekyll Blog',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
