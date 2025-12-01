# Routing Structure

## Overview

OMG Store uses Next.js 15.2.4 App Router with a comprehensive routing strategy that supports dynamic product pages, collection browsing, search functionality, and SEO optimization. The routing structure is organized around the main e-commerce user journeys.

## App Directory Structure

The application follows Next.js App Router conventions with the following structure:

```
app/
├── globals.css                 # Global styles
├── layout.tsx                  # Root layout (Server Component)
├── page.tsx                    # Homepage (Server Component)
├── error.tsx                   # Root error boundary (Client Component)
├── not-found.tsx               # 404 page (Client Component)
├── opengraph-image.png         # Open Graph image
├── favicon.ico                 # Site favicon
├── product/                    # Product routes
│   └── [handle]/
│       ├── page.tsx            # Individual product page
│       └── components/         # Product-specific components
│           ├── desktop-gallery.tsx
│           ├── mobile-gallery-slider.tsx
│           └── variant-selector-slots.tsx
└── shop/                       # Shop/collection routes
    ├── layout.tsx              # Shop layout (Server Component)
    ├── loading.tsx             # Shop loading state
    ├── page.tsx                # Main shop page
    ├── [collection]/
    │   ├── page.tsx            # Collection page
    │   └── loading.tsx         # Collection loading state
    ├── components/             # Shop-specific components
    │   ├── category-filter.tsx
    │   ├── color-filter.tsx
    │   ├── mobile-filters.tsx
    │   ├── product-card-skeleton.tsx
    │   ├── product-grid.tsx
    │   ├── product-list-content.tsx
    │   ├── product-list.tsx
    │   ├── results-controls.tsx
    │   ├── results-count.tsx
    │   ├── shop-breadcrumb.tsx
    │   ├── shop-filters.tsx
    │   ├── sort-dropdown.tsx
    │   ├── variant-selector.tsx
    │   ├── icons/
    │   │   └── logo-icon.tsx
    │   ├── product-card/
    │   │   ├── index.tsx
    │   │   └── product-image.tsx
    │   ├── hooks/
    │   │   ├── use-available-colors.tsx
    │   │   └── use-filter-count.tsx
    │   └── providers/
    │       └── products-provider.tsx
    └── error.tsx               # Shop-specific error boundary
```

## Route Patterns and Behavior

### 🏠 **Homepage Route** (`/`)

**File**: `app/page.tsx`
**Type**: Server Component
**Purpose**: Landing page showcasing featured products and collections

```typescript
// app/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OMG Store',
  description: 'Your one-stop shop for all your needs.',
};

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to OMG Store
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Discover amazing products for every occasion
            </p>
            <a 
              href="/shop" 
              className="inline-flex items-center px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Shop Now
            </a>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Featured Products
          </h2>
          <FeaturedProducts />
        </div>
      </section>

      {/* Collections Preview */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Shop by Category
          </h2>
          <CollectionsGrid />
        </div>
      </section>
    </div>
  );
}
```

### 🛍️ **Shop Pages** (`/shop`)

#### **Main Shop Layout** (`/shop/layout.tsx`)

**Type**: Server Component
**Purpose**: Shared layout for all shop pages with navigation and filters

```typescript
// app/shop/layout.tsx
import { getCollections } from '@/lib/shopify';
import { ProductsProvider } from './providers/products-provider';
import { ShopBreadcrumb } from './components/shop-breadcrumb';
import { ShopFilters } from './components/shop-filters';
import { MobileFilters } from './components/mobile-filters';

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const collections = await getCollections();

  return (
    <div className="flex flex-col min-h-screen">
      <div className="border-b">
        <div className="container mx-auto px-4">
          <ShopBreadcrumb />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <ProductsProvider>
          <div className="flex gap-8">
            {/* Desktop Filters Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24">
                <ShopFilters collections={collections} />
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <h1 className="text-2xl font-bold">Shop</h1>
                <MobileFilters collections={collections} />
              </div>
              {children}
            </main>
          </div>
        </ProductsProvider>
      </div>
    </div>
  );
}
```

#### **Main Shop Page** (`/shop/page.tsx`)

**Type**: Server Component with Client Components
**Purpose**: Displays all products with filtering and sorting capabilities

```typescript
// app/shop/page.tsx
import { Suspense } from 'react';
import { getProducts } from '@/lib/shopify';
import { ProductGrid } from './components/product-grid';
import { ProductList } from './components/product-list';
import { ResultsControls } from './components/results-controls';
import { ProductCardSkeleton } from './components/product-card-skeleton';
import { createProductFilterOptions } from './lib/filter-utils';

export const revalidate = 3600; // Revalidate every hour

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { 
    sort?: string;
    q?: string;
    category?: string;
    color?: string;
    page?: string;
  };
}) {
  // Server-side data fetching
  const {
    sort = 'CREATED_AT',
    q = '',
    category = '',
    color = '',
    page = '1'
  } = searchParams;

  const products = await getProducts({
    first: 24,
    sortKey: sort as ProductSortKey,
    query: [q, category, color].filter(Boolean).join(' '),
  });

  const filterOptions = createProductFilterOptions(products);

  return (
    <div className="space-y-6">
      {/* Results Controls */}
      <Suspense fallback={<ResultsControlsSkeleton />}>
        <ResultsControls
          totalResults={products.length}
          currentSort={sort}
          searchQuery={q}
          filterOptions={filterOptions}
        />
      </Suspense>

      {/* Products Grid/List */}
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGrid
          products={products}
          columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
        />
      </Suspense>

      {/* Pagination */}
      {products.length > 0 && (
        <ShopPagination
          currentPage={parseInt(page)}
          totalItems={products.length}
          itemsPerPage={24}
        />
      )}
    </div>
  );
}

// Skeleton components for loading states
function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

function ResultsControlsSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
      <div className="h-10 bg-gray-200 rounded w-48 animate-pulse" />
    </div>
  );
}
```

#### **Collection Pages** (`/shop/[collection]`)

**Type**: Dynamic Route (Server Component)
**Purpose**: Display products from a specific collection

```typescript
// app/shop/[collection]/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getCollectionProducts, getCollections } from '@/lib/shopify';
import { ProductGrid } from '../components/product-grid';
import { ProductCardSkeleton } from '../components/product-card-skeleton';
import { CollectionHero } from '../components/collection-hero';
import { ShopBreadcrumb } from '../components/shop-breadcrumb';

interface PageProps {
  params: {
    collection: string;
  };
  searchParams: {
    sort?: string;
    q?: string;
    page?: string;
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: PageProps) {
  const { collection } = params;
  const { sort = 'BEST_SELLING', q = '', page = '1' } = searchParams;

  // Validate collection exists
  const collections = await getCollections();
  const collectionExists = collections.some(c => c.handle === collection);

  if (!collectionExists) {
    notFound();
  }

  const products = await getCollectionProducts({
    collection,
    sortKey: sort as ProductCollectionSortKey,
    query: q,
    limit: 24,
  });

  const collectionData = collections.find(c => c.handle === collection);

  return (
    <div className="space-y-8">
      {/* Collection Hero */}
      <CollectionHero 
        collection={collectionData}
        productCount={products.length}
      />

      {/* Breadcrumb */}
      <ShopBreadcrumb 
        collection={collection}
        showHome={true}
      />

      {/* Products */}
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGrid
          products={products}
          columns={{ sm: 1, md: 2, lg: 3 }}
        />
      </Suspense>
    </div>
  );
}

// Generate static params for popular collections
export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map(collection => ({
    collection: collection.handle,
  }));
}

// Revalidate collection pages every hour
export const revalidate = 3600;
```

### 🛒 **Product Pages** (`/product/[handle]`)

#### **Dynamic Product Route** (`/product/[handle]/page.tsx`)

**Type**: Dynamic Route (Server Component)
**Purpose**: Individual product detail pages with variant selection and cart functionality

```typescript
// app/product/[handle]/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getProduct, getProducts } from '@/lib/shopify';
import { ProductGallery } from './components/desktop-gallery';
import { MobileGallerySlider } from './components/mobile-gallery-slider';
import { VariantSelector } from './components/variant-selector-slots';
import { AddToCart } from '@/components/cart/add-to-cart';
import { ProductBreadcrumb } from '@/components/breadcrumb';
import { ProductReviews } from './components/product-reviews';
import { RelatedProducts } from './components/related-products';
import { ProductDescription } from './components/product-description';

interface PageProps {
  params: {
    handle: string;
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const product = await getProduct(params.handle);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  const mainImage = product.images.edges[0]?.node;

  return {
    title: `${product.title} | OMG Store`,
    description: product.description,
    openGraph: {
      title: product.title,
      description: product.description,
      images: mainImage ? [mainImage.url] : [],
      type: 'product',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description: product.description,
      images: mainImage ? [mainImage.url] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: PageProps) {
  const product = await getProduct(params.handle);

  if (!product) {
    notFound();
  }

  // Get related products for cross-selling
  const relatedProducts = await getProducts({
    first: 4,
    query: `product_type:${product.productType}`,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <ProductBreadcrumb 
        product={{
          title: product.title,
          handle: product.handle,
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Gallery */}
        <div className="space-y-4">
          {/* Desktop Gallery */}
          <div className="hidden lg:block">
            <Suspense fallback={<GallerySkeleton />}>
              <ProductGallery product={product} />
            </Suspense>
          </div>

          {/* Mobile Gallery */}
          <div className="lg:hidden">
            <Suspense fallback={<GallerySkeleton />}>
              <MobileGallerySlider product={product} />
            </Suspense>
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">
              {product.title}
            </h1>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-2xl font-semibold text-primary">
                ${product.priceRange.minVariantPrice.amount}
              </span>
              {product.compareAtPriceRange?.minVariantPrice?.amount && (
                <span className="text-lg text-gray-500 line-through">
                  ${product.compareAtPriceRange.minVariantPrice.amount}
                </span>
              )}
            </div>
            <p className="text-gray-600">
              {product.productType}
            </p>
          </div>

          {/* Variant Selector */}
          <Suspense fallback={<VariantSelectorSkeleton />}>
            <VariantSelector
              product={product}
              variants={product.variants.edges.map(e => e.node)}
            />
          </Suspense>

          {/* Add to Cart */}
          <AddToCart
            product={product}
            variants={product.variants.edges.map(e => e.node)}
          />

          {/* Product Description */}
          <ProductDescription
            descriptionHtml={product.descriptionHtml}
            productType={product.productType}
          />
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 pt-16 border-t">
          <RelatedProducts
            products={relatedProducts}
            currentProductId={product.id}
          />
        </section>
      )}
    </div>
  );
}

// Generate static params for all products
export async function generateStaticParams() {
  const products = await getProducts({ first: 100 });
  return products.map(product => ({
    handle: product.handle,
  }));
}

// Revalidate product pages every hour
export const revalidate = 3600;

// Skeleton components
function GallerySkeleton() {
  return (
    <div className="aspect-square bg-gray-200 animate-pulse rounded-lg" />
  );
}

function VariantSelectorSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
```

## Route-Specific Components

### 🧭 **Breadcrumb System**

```typescript
// components/breadcrumb.tsx
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {item.href ? (
            <Link
              href={item.href}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">
              {item.label}
            </span>
          )}
          {index < items.length - 1 && (
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          )}
        </div>
      ))}
    </nav>
  );
}

// Product-specific breadcrumb
export function ProductBreadcrumb({ product }) {
  return (
    <Breadcrumb
      items={[
        { label: 'Home', href: '/' },
        { label: 'Shop', href: '/shop' },
        { label: product.title, href: undefined }
      ]}
      className="mb-8"
    />
  );
}

// Shop-specific breadcrumb
export function ShopBreadcrumb({ collection }) {
  return (
    <Breadcrumb
      items={[
        { label: 'Home', href: '/' },
        { label: 'Shop', href: '/shop' },
        ...(collection ? [
          { label: collection, href: `/shop/${collection}` }
        ] : []),
        { label: 'All Products', href: undefined }
      ]}
      className="mb-6"
    />
  );
}
```

### 🔍 **Search and Filter Integration**

```typescript
// lib/shopify/search.ts
import { getProducts, getCollectionProducts } from './shopify';

export interface SearchOptions {
  query?: string;
  category?: string;
  color?: string;
  priceMin?: number;
  priceMax?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

export function buildSearchQuery(options: SearchOptions): string {
  const parts: string[] = [];

  if (options.query) {
    parts.push(options.query);
  }

  if (options.category) {
    parts.push(`product_type:${options.category}`);
  }

  if (options.color) {
    parts.push(`variant_option:Color:${options.color}`);
  }

  if (options.priceMin !== undefined) {
    parts.push(`variants.price:>=${options.priceMin}`);
  }

  if (options.priceMax !== undefined) {
    parts.push(`variants.price:<=${options.priceMax}`);
  }

  return parts.join(' ');
}

export async function searchProducts(options: SearchOptions) {
  const searchQuery = buildSearchQuery(options);
  const sortKey = options.sort || 'RELEVANCE';
  const limit = options.limit || 24;
  const page = options.page || 1;
  const first = limit;
  const skip = (page - 1) * limit;

  return await getProducts({
    first,
    sortKey: sortKey as ProductSortKey,
    query: searchQuery,
    skip,
  });
}
```

### 📱 **Mobile-Specific Routing**

```typescript
// components/layout/mobile-menu.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function MobileMenu({ collections }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden p-2 rounded-md hover:bg-gray-100"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="p-4 space-y-4">
              <Link
                href="/"
                className={`block py-2 ${pathname === '/' ? 'text-primary font-medium' : 'text-gray-700'}`}
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              
              <Link
                href="/shop"
                className={`block py-2 ${pathname === '/shop' ? 'text-primary font-medium' : 'text-gray-700'}`}
                onClick={() => setIsOpen(false)}
              >
                Shop All
              </Link>

              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">Collections</h3>
                {collections.map((collection) => (
                  <Link
                    key={collection.handle}
                    href={`/shop/${collection.handle}`}
                    className={`block py-1 pl-4 text-sm ${
                      pathname === `/shop/${collection.handle}` 
                        ? 'text-primary font-medium' 
                        : 'text-gray-600'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {collection.title}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
```

## Error Handling and Loading States

### 🚨 **Error Boundaries**

```typescript
// app/error.tsx (Root Error Boundary)
'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Something went wrong!
        </h2>
        <p className="text-gray-600 mb-8">
          We apologize for the inconvenience. Please try again.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

// app/shop/error.tsx (Shop-specific Error Boundary)
'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Unable to load products
        </h2>
        <p className="text-gray-600 mb-6">
          There was an error loading the product catalog. Please try again.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    </div>
  );
}
```

### ⏳ **Loading States**

```typescript
// app/shop/loading.tsx
export default function ShopLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Results Controls Skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded w-48 animate-pulse" />
      </div>

      {/* Product Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="aspect-square bg-gray-200 animate-pulse rounded-t-lg" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
        <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
      </div>
    </div>
  );
}
```

### 🔍 **Not Found Pages**

```typescript
// app/not-found.tsx
import Link from 'next/link';
import { Search, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <Search className="w-12 h-12 text-gray-400" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          404 - Page Not Found
        </h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Search className="w-4 h-4" />
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}
```

## SEO Optimization

### 📈 **Metadata Management**

```typescript
// Generate metadata for different page types
export async function generateMetadata({
  params,
}: {
  params: { handle: string };
}): Promise<Metadata> {
  const product = await getProduct(params.handle);
  
  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'This product could not be found.',
    };
  }

  const mainImage = product.images.edges[0]?.node;
  const price = product.priceRange.minVariantPrice;

  return {
    title: `${product.title} | OMG Store`,
    description: product.description,
    keywords: [
      product.productType,
      ...product.variants.edges.map(({ node }) => 
        node.selectedOptions.find(opt => opt.name === 'Color')?.value
      ).filter(Boolean)
    ].filter(Boolean),
    
    openGraph: {
      title: product.title,
      description: product.description,
      url: `https://yourdomain.com/product/${product.handle}`,
      siteName: 'OMG Store',
      images: mainImage ? [
        {
          url: mainImage.url,
          width: 1200,
          height: 630,
          alt: mainImage.altText || product.title,
        }
      ] : [],
      locale: 'en_US',
      type: 'product',
    },
    
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description: product.description,
      images: mainImage ? [mainImage.url] : [],
    },
    
    other: {
      'product:price:amount': price.amount,
      'product:price:currency': price.currencyCode,
      'product:availability': product.variants.edges[0]?.node.availableForSale ? 'instock' : 'outofstock',
      'product:condition': 'new',
    },
  };
}
```

### 📋 **Structured Data**

```typescript
// lib/seo/structured-data.ts
import { Product } from '../shopify/types';

export function generateProductStructuredData(product: Product) {
  const mainImage = product.images.edges[0]?.node;
  const lowestPrice = product.priceRange.minVariantPrice;
  const availability = product.variants.edges[0]?.node.availableForSale 
    ? 'http://schema.org/InStock' 
    : 'http://schema.org/OutOfStock';

  return {
    '@context': 'http://schema.org/',
    '@type': 'Product',
    name: product.title,
    image: product.images.edges.map(edge => edge.node.url),
    description: product.description,
    sku: product.variants.edges[0]?.node.id,
    brand: {
      '@type': 'Brand',
      name: 'OMG Store',
    },
    offers: {
      '@type': 'Offer',
      url: `https://yourdomain.com/product/${product.handle}`,
      priceCurrency: lowestPrice.currencyCode,
      price: lowestPrice.amount,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      itemCondition: 'http://schema.org/NewCondition',
      availability: availability,
      seller: {
        '@type': 'Organization',
        name: 'OMG Store',
      },
    },
    ...(product.category && {
      category: product.category.name,
    }),
  };
}

export function generateBreadcrumbStructuredData(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'http://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}
```

This comprehensive routing structure provides a solid foundation for an e-commerce application with proper SEO optimization, loading states, error handling, and mobile responsiveness.