import type { Metadata, Viewport } from 'next';
import { AuthProvider } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'MarketBrain — AI-Native Investment Research',
  description:
    'AI-powered investment research workstation: pre-market briefings, real-time alerts, interactive research.',
  manifest: '/manifest.json',
  applicationName: 'MarketBrain',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MarketBrain',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0a0a0a',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
