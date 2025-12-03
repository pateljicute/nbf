import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getCollection, getProduct, getProducts } from '@/lib/api';
import { HIDDEN_PRODUCT_TAG } from '@/lib/constants';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { SidebarLinks } from '@/components/layout/sidebar/product-sidebar-links';
import { AddToCart, AddToCartButton } from '@/components/cart/add-to-cart';
import { storeCatalog } from '@/lib/constants';
import Prose from '@/components/prose';
import { formatPrice } from '@/lib/utils';
import { Suspense } from 'react';
import { cn } from '@/lib/utils';
import { PageLayout } from '@/components/layout/page-layout';
import { VariantSelectorSlots } from './components/variant-selector-slots';
import { MobileGallerySlider } from './components/mobile-gallery-slider';
import { DesktopGallery } from './components/desktop-gallery';

// Generate static params for all products at build time
export async function generateStaticParams() {
  try {
    const products = await getProducts({ limit: 100 }); // Get first 100 products

    return products.map(product => ({
      handle: product.handle,
    }));
  } catch (error) {
    console.error('Error generating static params for products:', error);
    return [];
  }
}

// Cache for 5 minutes to reduce Vercel bandwidth
export const revalidate = 300;

export async function generateMetadata(props: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const params = await props.params;
  const product = await getProduct(params.handle);

  if (!product) return notFound();

  const { url, width, height, altText: alt } = product.featuredImage || {};
  const indexable = !product.tags?.includes(HIDDEN_PRODUCT_TAG);

  return {
    title: product.seo?.title || product.title,
    description: product.seo?.description || product.description,
    robots: {
      index: indexable,
      follow: indexable,
      googleBot: {
        index: indexable,
        follow: indexable,
      },
    },
    openGraph: url
      ? {
        images: [
          {
            url,
            width,
            height,
            alt,
          },
        ],
      }
      : null,
  };
}

export default async function ProductPage(props: { params: Promise<{ handle: string }> }) {
  const params = await props.params;
  const product = await getProduct(params.handle);

  if (!product) return notFound();

  const collection = product.categoryId ? await getCollection(product.categoryId) : null;

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.featuredImage?.url,
    offers: {
      '@type': 'AggregateOffer',
      availability: product.availableForSale ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      priceCurrency: product.currencyCode,
      highPrice: product.priceRange.maxVariantPrice.amount,
      lowPrice: product.priceRange.minVariantPrice.amount,
    },
  };

  const [rootParentCategory] = collection?.parentCategoryTree?.filter(
    (c: any) => c.id !== storeCatalog.rootCategoryId
  ) ?? [undefined];

  const hasVariants = product.variants.length > 1;
  const hasEvenOptions = product.options.length % 2 === 0;

  return (
    <PageLayout className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd),
        }}
      />

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumbs - Top Full Width */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/shop" className="text-xs font-medium uppercase tracking-wider text-neutral-500 hover:text-blue-600 transition-colors">
                  Home
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/shop" className="text-xs font-medium uppercase tracking-wider text-neutral-500 hover:text-blue-600 transition-colors">
                  Properties
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {rootParentCategory && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`/shop/${rootParentCategory.id}`} className="text-xs font-medium uppercase tracking-wider text-neutral-500 hover:text-blue-600 transition-colors">
                      {rootParentCategory.name}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-xs font-medium uppercase tracking-wider text-neutral-900 truncate max-w-[200px]">
                {product.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-10 min-h-[600px]">
          {/* Left Column: Gallery (Amazon Style: Sticky) */}
          <div className="col-span-12 lg:col-span-5 xl:col-span-5 h-fit lg:sticky lg:top-24">
            {/* Mobile Gallery */}
            <div className="lg:hidden mb-6 h-[400px]">
              <Suspense fallback={null}>
                <MobileGallerySlider product={product} />
              </Suspense>
            </div>

            {/* Desktop Gallery */}
            <div className="hidden lg:block border border-neutral-200 rounded-lg p-2">
              <Suspense fallback={null}>
                <DesktopGallery product={product} />
              </Suspense>
            </div>
          </div>

          {/* Right Column: Product Details */}
          <div className="col-span-12 lg:col-span-7 xl:col-span-7 flex flex-col gap-6">

            {/* Title & Ratings */}
            <div className="border-b border-neutral-100 pb-4">
              <h1 className="text-2xl md:text-3xl font-medium text-neutral-900 mb-2">
                {product.title}
              </h1>

            </div>

            {/* Price Section */}
            <div className="bg-neutral-50/50 p-4 rounded-lg border border-neutral-100">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-neutral-900">
                  {formatPrice(
                    product.priceRange.minVariantPrice.amount,
                    product.priceRange.minVariantPrice.currencyCode
                  )}
                </span>
                <span className="text-lg text-neutral-500">/month</span>
                {product.compareAtPrice && (
                  <>
                    <span className="text-lg text-neutral-400 line-through">
                      {formatPrice(product.compareAtPrice.amount, product.compareAtPrice.currencyCode)}
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      {Math.round(((parseFloat(product.compareAtPrice.amount) - parseFloat(product.priceRange.minVariantPrice.amount)) / parseFloat(product.compareAtPrice.amount)) * 100)}% off
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-1">Inclusive of all taxes</p>
            </div>

            {/* Key Features / Highlights (Grid) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 border border-neutral-200 rounded-md text-center">
                <p className="text-[10px] text-neutral-500 uppercase font-bold">Type</p>
                <p className="text-sm font-medium">{product.tags?.[0] || 'Apartment'}</p>
              </div>
              <div className="p-3 border border-neutral-200 rounded-md text-center">
                <p className="text-[10px] text-neutral-500 uppercase font-bold">Status</p>
                <p className={`text-sm font-medium ${product.availableForSale ? 'text-green-600' : 'text-red-500'}`}>
                  {product.availableForSale ? 'Available' : 'Rented'}
                </p>
              </div>
              {product.tags && product.tags[1] && (
                <div className="p-3 border border-neutral-200 rounded-md text-center">
                  <p className="text-[10px] text-neutral-500 uppercase font-bold">City</p>
                  <p className="text-sm font-medium truncate">{product.tags[1]}</p>
                </div>
              )}
              {product.categoryId && (
                <div className="p-3 border border-neutral-200 rounded-md text-center">
                  <p className="text-[10px] text-neutral-500 uppercase font-bold">Location</p>
                  <p className="text-sm font-medium truncate">{product.categoryId}</p>
                </div>
              )}
            </div>

            {/* Variants & Actions */}
            <div className="space-y-6 py-4">
              <Suspense fallback={<VariantSelectorSlots product={product} fallback />}>
                <VariantSelectorSlots product={product} />
              </Suspense>

              <div className="flex flex-col gap-3">
                <Suspense
                  fallback={
                    <AddToCartButton
                      className={cn('w-full py-4 text-base font-bold uppercase tracking-wide', {
                        'col-span-full': !hasVariants || hasEvenOptions,
                      })}
                      product={product}
                      size="lg"
                    />
                  }
                >
                  <AddToCart
                    product={product}
                    size="lg"
                    className={cn('w-full py-4 text-base font-bold uppercase tracking-wide shadow-md hover:shadow-lg transition-all', {
                      'col-span-full': !hasVariants || hasEvenOptions,
                    })}
                  />
                </Suspense>
                <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Verified Owner
                  <span className="mx-2">•</span>
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Secure Transaction
                </div>
              </div>
            </div>

            {/* Short Description / Bullets */}
            <div className="border-t border-neutral-100 pt-6">
              <h3 className="font-bold text-neutral-900 mb-3">About this property</h3>
              <div className="prose prose-sm text-neutral-600 max-w-none line-clamp-4">
                <Prose html={product.descriptionHtml || product.description} />
              </div>
              <a href="#full-description" className="text-blue-600 text-sm font-medium hover:underline mt-2 inline-block">
                See full details
              </a>
            </div>

            <div className="pt-4">
              <SidebarLinks className="flex gap-4" />
            </div>

          </div>
        </div>

        {/* Full Description Section (Bottom) */}
        <div id="full-description" className="mt-16 pt-10 border-t border-neutral-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">Property Description</h2>
              <Prose
                className="prose-neutral max-w-none"
                html={product.descriptionHtml || product.description}
              />
            </div>
            <div className="lg:col-span-4">
              {/* Potential sidebar for related products or ads */}
              <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-100">
                <h3 className="font-bold text-neutral-900 mb-4">Safety Tips</h3>
                <ul className="space-y-3 text-sm text-neutral-600 list-disc pl-4">
                  <li>Always visit the property in person.</li>
                  <li>Check the amenities before booking.</li>
                  <li>Verify the owner's identity.</li>
                  <li>Do not pay without a receipt.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

      </div>
    </PageLayout>
  );
}
