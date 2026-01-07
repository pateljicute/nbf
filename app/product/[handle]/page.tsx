import type { Metadata, Viewport } from 'next';
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
import { ContactOwner } from '@/components/products/contact-owner';
import { storeCatalog } from '@/lib/constants';
import Prose from '@/components/prose';
import { formatPrice } from '@/lib/utils';
import { Suspense } from 'react';
import { cn } from '@/lib/utils';
import { PageLayout } from '@/components/layout/page-layout';
import { VariantSelectorSlots } from './components/variant-selector-slots';
import { MobileGallerySlider } from './components/mobile-gallery-slider';
import { DesktopGallery } from './components/desktop-gallery';
import {
  Wifi, Wind, Car, Droplets, Zap, Video,
  WashingMachine, ChefHat, ArrowUpFromDot,
  Users, Bath, Home, MapPin, ShieldCheck,
  Phone, User, CheckCircle, Smartphone, Navigation
} from 'lucide-react';

// Generate static params for all products at build time
export async function generateStaticParams() {
  try {
    const products = await getProducts({ limit: 100 });

    return products.map(product => ({
      handle: product.handle,
    }));
  } catch (error) {
    console.error('Error generating static params for products:', error);
    return [];
  }
}

// Cache for 5 minutes
export const revalidate = 300;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata(props: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const params = await props.params;
  const product = await getProduct(params.handle);

  if (!product) return notFound();

  const { url, width, height } = product.featuredImage || {};
  const indexable = !product.tags?.includes(HIDDEN_PRODUCT_TAG);
  const city = product.tags?.[1] || 'Mandsaur';
  const area = product.tags?.[2] || 'City';
  const alt = `Room for rent in ${city} - ${product.title} NBF Homes`;

  return {
    title: `${product.title} in ${area}, ${city} | No Brokerage | NBF Homes`,
    description: `Looking for a room in ${city}? Check out ${product.title} in ${area}. Direct owner contact, 0% brokerage.`,
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

  const hasVariants = (product.variants?.length || 0) > 1;
  const hasEvenOptions = (product.options?.length || 0) % 2 === 0;

  // Helper to check amenity availability
  const hasAmenity = (name: string) => product.amenities?.includes(name);

  const ALL_AMENITIES = [
    { id: 'wifi', label: 'WiFi', icon: Wifi },
    { id: 'ac', label: 'AC', icon: Wind },
    { id: 'parking', label: 'Parking', icon: Car },
    { id: 'water', label: '24/7 Water', icon: Droplets },
    { id: 'power', label: 'Power Backup', icon: Zap },
    { id: 'cctv', label: 'CCTV / Security', icon: Video },
    { id: 'laundry', label: 'Laundry', icon: WashingMachine },
    { id: 'kitchen', label: 'Kitchen', icon: ChefHat },
    { id: 'lift', label: 'Lift', icon: ArrowUpFromDot },
  ];

  // Map Generation
  // Using simple iframe embed for demo purposes. In production, use Google Maps API Key or Mapbox.
  // Address is roughly taken from Tags (Area, City)
  const addressQuery = encodeURIComponent(`${product.tags?.[2] || ''}, ${product.tags?.[1] || ''}`);
  const mapEmbedUrl = `https://maps.google.com/maps?q=${addressQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${addressQuery}`;

  return (
    // Added padding bottom for mobile sticky footer space
    <PageLayout className="bg-neutral-50/50 pb-24 lg:pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd),
        }}
      />

      <div className="container mx-auto px-4 pt-28 pb-12 md:pt-36">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/properties" className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-black transition-colors">
                  Home
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/properties" className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-black transition-colors">
                  Properties
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {rootParentCategory && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`/properties/${rootParentCategory.id}`} className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-black transition-colors">
                      {rootParentCategory.name}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-[10px] font-bold uppercase tracking-widest text-neutral-900 truncate max-w-[200px]">
                {product.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

          {/* LEFT COLUMN: Gallery & Details */}
          <div className="lg:col-span-8 space-y-8">

            {/* Gallery Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
              <div className="lg:hidden h-[300px] sm:h-[400px]">
                <Suspense fallback={<div className="w-full h-full bg-neutral-100 animate-pulse" />}>
                  <MobileGallerySlider product={product} />
                </Suspense>
              </div>
              <div className="hidden lg:block">
                <Suspense fallback={<div className="w-full h-[500px] bg-neutral-100 animate-pulse" />}>
                  <DesktopGallery product={product} />
                </Suspense>
              </div>
            </div>

            {/* Title (Mobile Only) */}
            <div className="lg:hidden">
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">{product.title}</h1>
              <div className="flex items-center text-neutral-500 text-sm mb-6">
                <MapPin className="w-4 h-4 mr-1" />
                {product.tags?.[2] || 'Location Unavailable'}
              </div>

              {/* Mobile Pricing Card */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">Monthly Rent</p>
                    <span className="text-3xl font-bold text-neutral-900">
                      {formatPrice(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode)}
                    </span>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide h-fit",
                    product.availableForSale ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {product.availableForSale ? 'Available' : 'Occupied'}
                  </div>
                </div>

                {product.securityDeposit && (
                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                    <div className="flex items-center text-neutral-500 text-xs font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                      Security Deposit
                    </div>
                    <span className="font-bold text-sm text-neutral-900">₹{Number(product.securityDeposit).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Key Highlights Cards (Refined Styling) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col items-center text-center gap-2 hover:bg-blue-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">Tenant</p>
                  <p className="text-sm font-bold text-neutral-900">{product.tenantPreference || 'Any'}</p>
                </div>
              </div>

              <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 flex flex-col items-center text-center gap-2 hover:bg-purple-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <Bath className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider mb-1">Bathroom</p>
                  <p className="text-sm font-bold text-neutral-900">{product.bathroom_type || 'Standard'}</p>
                </div>
              </div>

              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 flex flex-col items-center text-center gap-2 hover:bg-amber-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">Electricity</p>
                  <p className="text-sm font-bold text-neutral-900">{product.electricityStatus || 'Standard'}</p>
                </div>
              </div>

              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex flex-col items-center text-center gap-2 hover:bg-emerald-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Type</p>
                  <p className="text-sm font-bold text-neutral-900">{product.tags?.[0] || 'Property'}</p>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="bg-white p-4 md:p-8 rounded-2xl border border-neutral-200 shadow-sm overflow-hidden my-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">About Property</h2>
              <div className="prose prose-neutral prose-sm max-w-none text-neutral-600 break-words whitespace-pre-wrap [overflow-wrap:anywhere]">
                <Prose html={product.descriptionHtml || product.description} />
              </div>
            </div>

            {/* Amenities Section (Solid Color Icons) */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-sm">
              <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-neutral-900" />
                Amenities & Features
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                {ALL_AMENITIES.map((item) => {
                  const isAvailable = hasAmenity(item.id);
                  const Icon = item.icon;
                  return (
                    // Low opacity for unavailable ones
                    <div key={item.id} className={cn("flex items-center gap-3 transition-opacity", !isAvailable && "opacity-30 grayscale")}>
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                        // Solid black for active, lighter gray for inactive
                        isAvailable ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-400"
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={cn("text-sm font-medium", isAvailable ? "text-neutral-900" : "text-neutral-400")}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Location & Map Section (Expanded) */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-sm" id="location">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900">Location Details</h2>
                    <p className="text-neutral-500 text-sm">Explore the neighborhood</p>
                  </div>
                </div>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-neutral-800 transition-all hover:shadow-lg"
                >
                  <Navigation className="w-4 h-4" />
                  Get Directions
                </a>
              </div>

              {/* Bold Address Display with City */}
              <div className="mb-6 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                <p className="text-sm text-neutral-500 font-bold uppercase tracking-wider mb-1">Address</p>
                <div className="flex flex-col gap-1">
                  <p className="text-lg font-bold text-neutral-900">
                    {product.tags?.[2] || 'Area Listed'}
                  </p>
                  <p className="text-base text-neutral-700 font-medium">
                    {product.tags?.[1] || 'City Unavailable'}, {product.tags?.[1] ? 'India' : 'Madhya Pradesh'}
                  </p>
                </div>
              </div>

              {/* Map Embed - Larger Height */}
              <div className="w-full h-[450px] rounded-xl overflow-hidden shadow-inner border border-neutral-200 bg-neutral-100 relative group">
                <iframe
                  width="100%"
                  height="100%"
                  src={mapEmbedUrl}
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                />
              </div>
              <p className="italic text-xs text-neutral-500 mt-2 text-center pb-2">
                Note: The location shown on Google Maps is an area estimate. Please contact the owner directly for the exact location.
              </p>
            </div>

          </div>

          {/* RIGHT COLUMN: Sidebar (Desktop Sticky) */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-24 space-y-6">

              {/* Title */}
              <div>
                <h1 className="text-3xl font-bold font-serif text-neutral-900 mb-2 leading-tight">
                  {product.title}
                </h1>
                <div className="flex items-center text-neutral-500 text-sm mb-4">
                  <MapPin className="w-4 h-4 mr-1" />
                  {product.tags?.[2] || 'Location Unavailable'}
                </div>
              </div>

              {/* Price Card */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-sm text-neutral-500 font-medium mb-1">Monthly Rent</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-neutral-900">
                        {formatPrice(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode)}
                      </span>
                    </div>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                    product.availableForSale ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {product.availableForSale ? 'Available' : 'Occupied'}
                  </div>
                </div>

                {/* Security Deposit */}
                {product.securityDeposit && (
                  <div className="flex items-center justify-between py-3 border-t border-neutral-100 mb-6">
                    <div className="flex items-center text-neutral-600 text-sm">
                      <ShieldCheck className="w-4 h-4 mr-2 text-neutral-400" />
                      Security Deposit
                    </div>
                    <span className="font-bold text-neutral-900">₹{Number(product.securityDeposit).toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* Contact Button */}
                <ContactOwner
                  product={product}
                  className="w-full py-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold uppercase tracking-widest transition-all shadow-lg shadow-neutral-900/10 flex items-center justify-center gap-2"
                />

                <p className="text-xs text-center text-neutral-500 mt-4 font-medium">
                  No Booking Fees. Directly contact the owner and visit the property for free.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MOBILE STICKY FOOTER (Fixed Bottom Code) */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-neutral-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] lg:hidden z-50 flex items-center justify-between gap-4 safe-area-bottom">
        <div>
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-0.5">Rent</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-neutral-900">
              {formatPrice(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode)}
            </span>
          </div>
        </div>
        <ContactOwner
          product={product}
          className="flex-1 py-1"
        />
      </div>

    </PageLayout>
  );
}
