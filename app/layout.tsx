import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { Toaster } from 'sonner';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
// CartProvider removed
import { Collection } from '@/lib/types';
import { getCollections } from '@/lib/api';
import { Header } from '../components/layout/header';
import { AuthProvider } from '@/lib/auth-context';
import { RealtimeProvider } from '@/lib/realtime-context';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nbfhomes.in';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'NBFHOMES - Best PG & Room Finder in India | No Brokerage',
  description: 'Search 10,000+ verified PGs & rooms across India. Zero brokerage, direct owner contact, student-friendly listings.',
  applicationName: 'NBFHOMES',
  keywords: ['PG in India', 'rooms for rent', 'no brokerage', 'student housing', 'flats for rent India', 'owner listed properties'],
  openGraph: {
    title: 'NBFHOMES | No-Brokerage PG & Room Finder in India',
    description: 'Find verified PGs, rooms, and flats with direct owner contact. Zero brokerage, nationwide coverage.',
    url: siteUrl,
    siteName: 'NBFHOMES',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NBFHOMES | No-Brokerage PG & Room Finder in India',
    description: 'Verified PGs, rooms, and flats. Zero brokerage. Direct owner contact.',
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
};

// Create a separate component for the client-side layout
function ClientLayout({ children, collections }: { children: React.ReactNode; collections: Collection[] }) {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <NuqsAdapter>
            <Header collections={collections} />
            <Suspense>{children}</Suspense>
            <Toaster closeButton position="bottom-right" />
          </NuqsAdapter>
      </RealtimeProvider>
    </AuthProvider>
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let collections: Collection[] = [];
  
  try {
    // Try to fetch collections, but don't block rendering if it fails
    collections = await getCollections();
  } catch (error) {
    console.error('Error in RootLayout:', error);
    // Continue with empty collections array if there's an error
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased min-h-screen`}>
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'NBFHOMES',
              url: siteUrl,
              logo: `${siteUrl}/opengraph-image.png`,
              sameAs: [
                'https://www.instagram.com/joyco.studio/',
              ],
              areaServed: [{ '@type': 'Country', name: 'India' }],
              description: 'No-brokerage PGs, rooms, and flats across India with direct owner contact.',
            }),
          }}
        />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'NBFHOMES',
              url: siteUrl,
              potentialAction: {
                '@type': 'SearchAction',
                target: `${siteUrl}/shop?query={search_term_string}`,
                'query-input': 'required name=search_term_string',
              },
              inLanguage: 'en-IN',
            }),
          }}
        />
        <ClientLayout collections={collections}>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
