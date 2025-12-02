import { getCollectionProducts, getCollections, getProducts, getCollection } from '@/lib/api';
import type { Product, ProductCollectionSortKey, ProductSortKey } from '@/lib/types';
import { ProductListContent } from './product-list-content';
import { mapSortKeys } from '@/lib/utils';

interface ProductListProps {
  collection: string;
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function ProductList({ collection, searchParams }: ProductListProps) {
  const query = typeof searchParams?.q === 'string' ? searchParams.q : undefined;
  const sort = typeof searchParams?.sort === 'string' ? searchParams.sort : undefined;
  const minPrice = typeof searchParams?.minPrice === 'string' ? searchParams.minPrice : undefined;
  const maxPrice = typeof searchParams?.maxPrice === 'string' ? searchParams.maxPrice : undefined;
  const location = typeof searchParams?.location === 'string' ? searchParams.location : undefined;
  const propertyType = typeof searchParams?.propertyType === 'string' ? searchParams.propertyType : undefined;
  const amenities = typeof searchParams?.amenities === 'string' ? searchParams.amenities.split(',') : undefined;

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
        propertyType,
        amenities
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
      <div className="flex flex-col gap-6 pt-8 pb-4 border-b border-neutral-100">
        <h1 className="text-5xl md:text-7xl font-serif font-medium tracking-tight text-neutral-900">
          {heroTitle}
        </h1>
        <p className="text-lg md:text-xl text-neutral-500 max-w-3xl leading-relaxed font-light">
          {heroDescription}
        </p>
      </div>

      <ProductListContent products={products} collections={collections} />
    </div>
  );
}
