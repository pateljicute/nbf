import { storeCatalog } from '@/lib/constants';
import ProductList from './components/product-list';
import { Metadata, Viewport } from 'next';
import { Suspense } from 'react';

import { ProductGrid } from './components/product-grid';
import { ProductCardSkeleton } from './components/product-card-skeleton';

export async function generateMetadata(props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const q = searchParams?.q ? String(searchParams.q).trim() : '';
  const city = q || 'Mandsaur & Nearby';
  const mode = searchParams?.mode === 'sell' ? 'Sale' : 'Rent';
  
  const title = `Properties for ${mode} in ${city} | NBF Homes`;
  const description = `Browse our collection of verified properties for ${mode.toLowerCase()} in ${city}. Find houses, flats, PGs and more with 0% brokerage.`;

  return {
    title,
    description,
    keywords: [`Properties for ${mode}`, `Real Estate in ${city}`, `Buy flat in ${city}`, `Rent PG in ${city}`, 'Zero Brokerage'],
    alternates: {
      canonical: `https://www.nbfhomes.in/properties?mode=${searchParams?.mode || 'rent'}${q ? `&q=${q}` : ''}`,
    }
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Enable ISR with 1 minute revalidation
// Cache for 5 minutes to reduce Vercel bandwidth
export const revalidate = 600;

export default async function Shop(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="pt-32 pb-20 min-h-screen bg-neutral-50/30">
      <Suspense
        fallback={
          <div className="container mx-auto px-4">
            <ProductGrid>
              {Array.from({ length: 12 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </ProductGrid>
          </div>
        }
      >
        <ProductList collection={storeCatalog.rootCategoryId} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
