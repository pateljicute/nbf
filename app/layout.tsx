import type { Metadata, Viewport } from 'next';
// import { Inter } from 'next/font/google';

// const inter = Inter({
//   variable: '--font-geist-sans', // Keeping same variable name to avoid refactoring CSS
//   subsets: ['latin'],
//   display: 'swap',
// });

import './globals.css';
import { Collection } from '@/lib/types';
import { getCollections } from '@/lib/api';

import { WhatsappPopup } from '@/components/layout/whatsapp-popup';
import { ProvidersWrapper } from '@/components/providers-wrapper';
import { UserOnboardingManager } from '@/components/auth/user-onboarding-manager';
import { FloatingInstallPrompt } from '@/components/pwa/floating-install-prompt';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nbfhomes.in';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'NBF Homes | Best PGs, Rooms & Shared Flats in Mandsaur & Nearby Cities',
  description: 'Find verified PGs and rooms in Mandsaur, Neemuch, Ratlam, and Indore with zero brokerage. Connect directly with owners on NBF Homes.',
  applicationName: 'NBFHOMES',
  keywords: ['Rooms in Mandsaur', 'PG in Neemuch', 'Flat for rent in Ratlam', 'Student housing Ujjain', 'Rooms near me', 'Low budget rooms Mandsaur', 'NBF Homes rentals'],
  openGraph: {
    title: 'NBF Homes | Best PGs, Rooms & Shared Flats in Mandsaur & Nearby Cities',
    description: 'Find verified PGs and rooms in Mandsaur, Neemuch, Ratlam, and Indore with zero brokerage. Connect directly with owners on NBF Homes.',
    url: siteUrl,
    siteName: 'NBFHOMES',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NBF Homes | Best PGs, Rooms & Shared Flats in Mandsaur & Nearby Cities',
    description: 'Find verified PGs and rooms in Mandsaur, Neemuch, Ratlam, and Indore with zero brokerage. Connect directly with owners on NBF Homes.',
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Force rebuild timestamp: 2026-01-06
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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body
        style={{ '--font-geist-sans': 'sans-serif' } as React.CSSProperties}
        className={`antialiased min-h-screen overflow-y-auto`}
      >
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              name: 'NBFHOMES',
              url: siteUrl,
              logo: `${siteUrl}/opengraph-image.png`,
              image: `${siteUrl}/opengraph-image.png`,
              description: 'Rooms in Mandsaur, PG in Neemuch, Flat for rent in Ratlam, Student housing Ujjain, Rooms near me, Low budget rooms Mandsaur, NBF Homes rentals. Find verified PGs and rooms in Mandsaur, Neemuch, Ratlam, and Indore with zero brokerage.',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Mandsaur',
                addressRegion: 'Madhya Pradesh',
                addressCountry: 'IN'
              },
              areaServed: [
                { '@type': 'City', name: 'Mandsaur' },
                { '@type': 'City', name: 'Neemuch' },
                { '@type': 'City', name: 'Ratlam' },
                { '@type': 'City', name: 'Indore' },
                { '@type': 'City', name: 'Ujjain' },
                { '@type': 'City', name: 'Jaora' },
                { '@type': 'City', name: 'Pratapgarh' },
                { '@type': 'City', name: 'Kota' },
                { '@type': 'City', name: 'Chittorgarh' }
              ],
              sameAs: [
                'https://x.com/nbfhomes',
                'https://www.linkedin.com/in/nbf-homes-2689b4381',
                'https://www.facebook.com/share/17qdRqXzeN/',
                'https://www.instagram.com/nbfhomes',
                'https://whatsapp.com/channel/0029Vb74TGqFnSzA8mE6wE0Y'
              ],
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
                target: `${siteUrl}/properties?query={search_term_string}`,
                'query-input': 'required name=search_term_string',
              },
              inLanguage: 'en-IN',
            }),
          }}
        />
        <ProvidersWrapper collections={collections}>
          <FloatingInstallPrompt />
          {children}
          <UserOnboardingManager />
          <WhatsappPopup />
        </ProvidersWrapper>

      </body>
    </html>
  );
}
