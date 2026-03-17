import type { Metadata, Viewport } from 'next';
import { AuthProvider } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'MarketBrain — AI-Native Investment Research',
  description:
    'AI-powered investment research workstation: pre-market briefings, real-time alerts, interactive research.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
