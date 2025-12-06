import { storeCatalog } from '@/lib/constants';
import ProductList from './components/product-list';
import { Metadata, Viewport } from 'next';
import { Suspense } from 'react';

import { ProductGrid } from './components/product-grid';
import { ProductCardSkeleton } from './components/product-card-skeleton';

export const metadata: Metadata = {
  title: 'OMG Store | Shop',
  description: 'OMG Store, your one-stop shop for all your needs.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

// Enable ISR with 1 minute revalidation
// Cache for 5 minutes to reduce Vercel bandwidth
export const revalidate = 600;

export default async function Shop(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  return (
    <>
      <Suspense
        fallback={
          <>

            <ProductGrid>
              {Array.from({ length: 12 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </ProductGrid>
          </>
        }
      >
        <ProductList collection={storeCatalog.rootCategoryId} searchParams={searchParams} />
      </Suspense>
    </>
  );
}
