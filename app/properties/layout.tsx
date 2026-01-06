import { DesktopFilters } from './components/shop-filters';
import { Suspense } from 'react';
import { getCollections } from '@/lib/api';
import { PageLayout } from '@/components/layout/page-layout';
import { MobileFilters } from './components/mobile-filters';
import { ProductsProvider } from './providers/products-provider';

// Enable ISR with 1 minute revalidation for the layout
// Cache for 5 minutes to reduce Vercel bandwidth
export const revalidate = 300;

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const collections = await getCollections();

  return (
    <PageLayout>
      <ProductsProvider>
        <div className="flex flex-col w-full h-full pt-[var(--top-spacing)]">
          <Suspense fallback={null}>{children}</Suspense>
        </div>
      </ProductsProvider>
    </PageLayout>
  );
}
