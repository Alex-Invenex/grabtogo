import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AuthProvider } from '@/components/providers/session-provider';
import { SocketProvider } from '@/components/providers/socket-provider';
import './globals.css';
import './modern-animations.css';

// Note: Google Fonts temporarily disabled due to network connectivity issues during build
// Using system fonts as fallback. To re-enable, uncomment the imports below and update the html className
// import { Inter, Poppins } from 'next/font/google';
//
// const inter = Inter({
//   subsets: ['latin'],
//   variable: '--font-inter',
//   display: 'swap',
//   weight: ['400', '500', '600', '700'],
// });
//
// const poppins = Poppins({
//   subsets: ['latin'],
//   variable: '--font-poppins',
//   display: 'swap',
//   weight: ['600', '700', '800'],
// });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: 'GrabtoGo - Deals & Offers to Grab',
  description:
    'A curated selection of offers and deals in your area with amazing discounts from local businesses in Kerala',
  keywords: [
    'deals',
    'offers',
    'local businesses',
    'Kerala',
    'discounts',
    'shopping',
    'marketplace',
    'Kottayam',
  ],
  authors: [{ name: 'GrabtoGo Team' }],
  creator: 'GrabtoGo',
  publisher: 'GrabtoGo',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GrabtoGo',
  },
  openGraph: {
    type: 'website',
    siteName: 'GrabtoGo',
    title: 'GrabtoGo - Deals & Offers to Grab',
    description: 'A curated selection of offers and deals in your area with amazing discounts',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'GrabtoGo - Deals & Offers to Grab',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GrabtoGo - Deals & Offers to Grab',
    description: 'A curated selection of offers and deals in your area with amazing discounts',
    images: ['/twitter-image.png'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="GrabtoGo" />
        <meta name="application-name" content="GrabtoGo" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#000000" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthProvider>
          <SocketProvider>
            <ErrorBoundary>
              {children}
              <Toaster />
            </ErrorBoundary>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
