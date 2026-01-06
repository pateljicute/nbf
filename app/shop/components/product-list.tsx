import { getCollectionProducts, getCollections, getProducts, getCollection } from '@/lib/api';
import type { Product, ProductCollectionSortKey, ProductSortKey } from '@/lib/types';
import { ProductListContent } from './product-list-content';
import { mapSortKeys } from '@/lib/utils';

interface ProductListProps {
  collection: string;
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function ProductList({ collection, searchParams }: ProductListProps) {
  const query = typeof searchParams?.q === 'string' ? searchParams.q : (typeof searchParams?.search === 'string' ? searchParams.search : undefined);
  const sort = typeof searchParams?.sort === 'string' ? searchParams.sort : undefined;
  const minPrice = typeof searchParams?.minPrice === 'string' ? searchParams.minPrice : undefined;
  const maxPrice = typeof searchParams?.maxPrice === 'string' ? searchParams.maxPrice : undefined;
  const location = typeof searchParams?.location === 'string' ? searchParams.location : (typeof searchParams?.search === 'string' ? searchParams.search : undefined); // Map search to location as fallback
  const type = typeof searchParams?.type === 'string' ? searchParams.type : undefined;
  const propertyType = typeof searchParams?.type === 'string' ? searchParams.type : '';
  const amenities = typeof searchParams?.amenities === 'string' ? [searchParams.amenities] : (Array.isArray(searchParams?.amenities) ? searchParams.amenities : undefined);

  const isRootCollection = collection === 'joyco-root' || collection === 'root' || !collection;

  const { sortKey, reverse } = isRootCollection ? mapSortKeys(sort, 'product') : mapSortKeys(sort, 'collection');

  let products: Product[] = [];
  let collectionData;

  try {
    if (isRootCollection) {
      products = await getProducts({
        sortKey: sortKey as ProductSortKey,
        query,
        reverse,
        minPrice,
        maxPrice,
        location,
        propertyType: propertyType || type,
        amenities,
        type: type // Explicitly pass type if needed
      });
    } else {
      // For collection-specific pages, we'll still use the collection products endpoint
      // but we may want to add similar filtering capabilities in the future
      products = await getCollectionProducts({
        collection,
        query,
        sortKey: sortKey as ProductCollectionSortKey,
        reverse,
      });
      collectionData = await getCollection(collection);
    }

    // Safety check for empty products array
    if (!products) {
      products = [];
    }

  } catch (error) {
    console.error('Error fetching products:', error);
    products = [];
  }

  const collections = await getCollections();

  const heroTitle = collectionData?.title || 'All Properties';
  const heroDescription = collectionData?.description || 'Find the perfect accommodation with no brokerage. Search among thousands of verified properties.';

  return (
    <div className="flex flex-col gap-8 pb-24">
      {/* Shop Hero Section */}
      <div className="flex flex-col gap-6 pt-4 pb-4 md:pb-6 border-b border-neutral-100">
        <h1 className="text-4xl md:text-6xl font-serif font-medium tracking-tight text-neutral-900 text-center lg:text-left">
          {heroTitle}
        </h1>
      </div>

      {products.length > 0 ? (
        <ProductListContent
          products={products}
          collections={collections}
          searchQuery={typeof location === 'string' ? location : (typeof query === 'string' ? query : undefined)}
        />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center border-2 border-dashed border-neutral-200 rounded-3xl bg-neutral-50/50 p-8 mx-4">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </div>
          <h3 className="text-lg font-bold text-neutral-900 mb-1">No properties found in this budget</h3>
          <p className="text-neutral-500 text-sm max-w-xs mx-auto mb-6">
            Try adjusting your price range or filters to see more results.
          </p>
          <a
            href="/shop"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-neutral-900 text-white font-bold rounded-xl text-sm transition-transform active:scale-95 shadow-md hover:bg-neutral-800"
          >
            Clear All Filters
          </a>
        </div>
      )}
    </div>
  );
}
