import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@/lib/env-check'; // Validate environment variables on startup

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Jekyll Chirpy CMS Panel',
  description: 'Modern cloud-based CMS for Jekyll Chirpy blogs - Edit, manage, and publish posts from anywhere with rich text editing, image optimization, and seamless GitHub integration.',
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
