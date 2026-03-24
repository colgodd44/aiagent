import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Agent',
  description: 'Your personal AI assistant',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
