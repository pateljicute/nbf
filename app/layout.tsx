import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { Toaster } from 'sonner';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { CartProvider } from '@/components/cart/cart-context';
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

export const metadata: Metadata = {
  title: 'NBFHOMES - Best PG & Room Finder in India | No Brokerage',
  description: 'Search 10,000+ verified PGs & rooms. Zero Brokerage. Best for Students & Professionals. Book Now!',
};

// Create a separate component for the client-side layout
function ClientLayout({ children, collections }: { children: React.ReactNode; collections: Collection[] }) {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <CartProvider>
          <NuqsAdapter>
            <Header collections={collections} />
            <Suspense>{children}</Suspense>
            <Toaster closeButton position="bottom-right" />
          </NuqsAdapter>
        </CartProvider>
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
        <ClientLayout collections={collections}>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
