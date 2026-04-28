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
import { SharePropertyButton } from '@/components/products/share-property-button';
import { ReportPropertyModal } from '@/components/products/report-property-modal';
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
  Wifi, Car, Shield, Waves, Zap, Utensils, Shirt, PersonStanding, MapPin, Navigation, ExternalLink, AlertTriangle,
  Droplets, Bath, Armchair, Monitor, BookOpen, Warehouse, Trees, CheckCircle, Video, ArrowUpFromDot, Users, Home,
  Smartphone, ShieldCheck, Scaling, BadgeCheck
} from 'lucide-react';
import { ViewTracker } from '@/components/products/view-tracker';

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
  const city = product.city || product.tags?.[1] || 'Mandsaur';
  const area = product.locality || product.tags?.[2] || 'City';
  const state = product.state || 'Madhya Pradesh';
  const isSell = product.listing_type === 'sell';
  const typeLabel = product.type || 'Property';

  const alt = isSell 
    ? `${typeLabel} for sale in ${area}, ${city}, ${state} - ${product.title} NBF Homes`
    : `Room for rent in ${area}, ${city}, ${state} - ${product.title} NBF Homes`;

  const metaTitle = isSell 
    ? `${product.title} in ${area}, ${city} | Buy ${typeLabel} | NBF Homes`
    : `${product.title} in ${area}, ${city} | No Brokerage | NBF Homes`;

  const metaDesc = isSell
    ? `Looking to buy a ${typeLabel} in ${city}? Check out ${product.title} in ${area}. Direct owner contact, 0% brokerage.`
    : `Looking for a room in ${city}? Check out ${product.title} in ${area}. Direct owner contact, 0% brokerage.`;

  const metaKeywords = isSell ? [
      `Buy ${typeLabel} in ${city}`,
      `${typeLabel} for sale in ${city}`,
      `Real Estate in ${city}`,
      `Property in ${area}`,
      'No brokerage',
      city,
      area,
      typeLabel
  ] : [
      'Room for rent',
      `PG in ${city}`,
      'Flat for rent',
      'No brokerage',
      city,
      area,
      typeLabel
  ];

  return {
    title: metaTitle,
    description: metaDesc,
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
    alternates: {
      canonical: `https://nbfhomes.in/product/${product.handle}`,
    },
    keywords: metaKeywords.filter(Boolean),
  };
}

export default async function ProductPage(props: { params: Promise<{ handle: string }> }) {
  const params = await props.params;
  const product = await getProduct(params.handle);

  if (!product) return notFound();

  const collection = product.categoryId ? await getCollection(product.categoryId) : null;

  const isSell = product.listing_type === 'sell';
  
  let schemaType = 'RealEstateListing';
  if (product.type === 'House' || product.type === 'Villa') schemaType = 'SingleFamilyResidence';
  if (product.type === 'Flat' || product.type === 'Apartment') schemaType = 'Apartment';

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: product.title,
    description: product.description,
    image: product.featuredImage?.url,
    offers: {
      '@type': 'Offer',
      availability: product.availableForSale ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      priceCurrency: product.currencyCode,
      price: product.price || '0',
    },
  };

  const [rootParentCategory] = collection?.parentCategoryTree?.filter(
    (c: any) => c.id !== storeCatalog.rootCategoryId
  ) ?? [undefined];

  const hasVariants = (product.variants?.length || 0) > 1;
  const hasEvenOptions = (product.options?.length || 0) % 2 === 0;

  // Sync with PostPropertyPage - Full Amenities List
  const ALL_AMENITIES = [
    { id: 'wifi', label: 'WiFi', icon: Wifi },
    { id: 'ac', label: 'AC', icon: Waves },
    { id: 'parking', label: 'Parking', icon: Car },
    { id: 'water', label: '24/7 Water', icon: Droplets },
    { id: 'power', label: 'Power Backup', icon: Zap },
    { id: 'cctv', label: 'CCTV / Security', icon: Shield },
    { id: 'laundry', label: 'Laundry', icon: Shirt },
    { id: 'kitchen', label: 'Kitchen', icon: Utensils },
    { id: 'lift', label: 'Lift', icon: PersonStanding },
    { id: 'ro_water', label: 'RO Water', icon: Droplets },
    { id: 'attached_washroom', label: 'Attach Washroom', icon: Bath },
    { id: 'geyser', label: 'Geyser', icon: Waves },
    { id: 'study_table', label: 'Study Table', icon: BookOpen },
    { id: 'wardrobe', label: 'Wardrobe', icon: Warehouse },
    { id: 'balcony', label: 'Balcony', icon: Trees },
  ];

  // Helper to check amenity availability
  const hasAmenity = (name: string) => product.amenities?.includes(name);

  // Filter Active Amenities for display (predefined ones with icons)
  const activeAmenities = ALL_AMENITIES.filter(item => hasAmenity(item.id));

  // Custom amenities: ones saved that don't match any predefined ID
  const predefinedIds = new Set(ALL_AMENITIES.map(a => a.id));
  const customAmenities = (product.amenities || []).filter(a => !predefinedIds.has(a));

  const hasAnyAmenity = activeAmenities.length > 0 || customAmenities.length > 0;

  // Map Generation: 100% Exact Pinpoint using Coordinates (if available)
  let mapEmbedUrl = '';
  let directionsUrl = '';
  
  if (product.latitude && product.longitude) {
    // Priority: Exact GPS coordinates
    mapEmbedUrl = `https://maps.google.com/maps?q=${product.latitude},${product.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${product.latitude},${product.longitude}`;
  } else {
    // Fallback: Address String Matching
    const addressString = [product.address, product.locality, product.city, product.state].filter(Boolean).join(', ');
    const addressQuery = encodeURIComponent(addressString || `${product.tags?.[2] || ''}, ${product.tags?.[1] || ''}`);
    mapEmbedUrl = `https://maps.google.com/maps?q=${addressQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    directionsUrl = `https://www.google.com/maps/search/?api=1&query=${addressQuery}`;
  }

  const rawDescription = product.descriptionHtml || product.description || '';
  let mainDescription = rawDescription;
  let seoSection = '';

  if (rawDescription.includes('--- About Property & Area ---')) {
    const parts = rawDescription.split('--- About Property & Area ---');
    mainDescription = parts[0].trim();
    seoSection = parts[1].trim();
  } else if (rawDescription.includes('--- Search Keywords ---')) {
    const parts = rawDescription.split('--- Search Keywords ---');
    mainDescription = parts[0].trim();
    seoSection = parts[1].trim();
  }

  return (
    // Added padding bottom for mobile sticky footer space
    <PageLayout className="bg-neutral-50/50 pb-24 lg:pb-12">
      <ViewTracker propertyId={product.id} />
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
              <h1 className="text-2xl font-medium text-neutral-800 mb-2 flex items-start gap-2">
                {product.title}
                {(product as any).is_verified && (
                  <BadgeCheck className="w-6 h-6 text-blue-500 fill-blue-50 shrink-0 mt-0.5" />
                )}
              </h1>
              <div className="flex items-center text-black text-sm mb-6 font-bold">
                <MapPin className="w-4 h-4 mr-1 stroke-[2.5]" />
                {(() => {
                  const loc = product.locality || product.tags?.[2] || product.address || product.location || '';
                  const city = product.city || '';
                  const parts = [loc, city].filter(Boolean);

                  // Dedupe
                  if (parts.length > 1 && parts[0]?.toLowerCase().includes((parts[1] || '').toLowerCase())) {
                    return parts[0];
                  }
                  return parts.join(', ');
                })() || 'Location Unavailable'}
              </div>

              {/* Mobile Pricing Card */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">{product.listing_type === 'sell' ? 'Asking Price' : 'Monthly Rent'}</p>
                    <span className="text-3xl font-bold text-neutral-900">
                      {formatPrice(product.price || product.priceRange?.minVariantPrice?.amount || '0', product.priceRange?.minVariantPrice?.currencyCode || 'INR')}
                    </span>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide h-fit",
                    product.availableForSale ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {product.availableForSale ? 'Available' : 'Occupied'}
                  </div>
                </div>

                {product.securityDeposit && product.listing_type !== 'sell' && (
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

            {/* Key Highlights Cards (Merged & Refined) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

              {/* Type - Emerald */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex flex-col items-center text-center gap-2 hover:bg-emerald-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Type</p>
                  <p className="text-sm font-bold text-neutral-900">{product.type || product.tags?.[0] || 'Property'}</p>
                </div>
              </div>

              {/* Area - Indigo (NEW) */}
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex flex-col items-center text-center gap-2 hover:bg-indigo-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Scaling className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mb-1">Area</p>
                  <p className="text-sm font-bold text-neutral-900">{product.builtUpArea ? `${product.builtUpArea} sq.ft` : 'N/A'}</p>
                </div>
              </div>

              {/* Furnishing - Rose (NEW) */}
              <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 flex flex-col items-center text-center gap-2 hover:bg-rose-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  <Armchair className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider mb-1">Furnishing</p>
                  <p className="text-sm font-bold text-neutral-900">{product.furnishingStatus || 'Unfurnished'}</p>
                </div>
              </div>

              {/* Floor - Cyan (NEW) */}
              <div className="bg-cyan-50/50 p-4 rounded-xl border border-cyan-100 flex flex-col items-center text-center gap-2 hover:bg-cyan-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600">
                  <ArrowUpFromDot className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-cyan-600 font-bold uppercase tracking-wider mb-1">Floor</p>
                  <p className="text-sm font-bold text-neutral-900">
                    {product.floorNumber ? `${product.floorNumber}${product.totalFloors ? ` / ${product.totalFloors}` : ''}` : 'Ground'}
                  </p>
                </div>
              </div>

              {/* Tenant - Blue */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col items-center text-center gap-2 hover:bg-blue-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">Tenant</p>
                  <p className="text-sm font-bold text-neutral-900">{product.tenantPreference || 'Any'}</p>
                </div>
              </div>

              {/* Bathroom - Purple */}
              <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 flex flex-col items-center text-center gap-2 hover:bg-purple-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <Bath className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider mb-1">Bathroom</p>
                  <p className="text-sm font-bold text-neutral-900">{product.bathroom_type || 'Standard'}</p>
                </div>
              </div>

              {/* Electricity - Amber */}
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 flex flex-col items-center text-center gap-2 hover:bg-amber-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">Electricity</p>
                  <p className="text-sm font-bold text-neutral-900">{product.electricityStatus || 'Standard'}</p>
                </div>
              </div>

            </div>

            {/* Description Section */}
            <div className="bg-white p-4 md:p-8 rounded-2xl border border-neutral-200 shadow-sm overflow-hidden my-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">About Property</h2>
              <div className="prose prose-neutral prose-sm max-w-none text-neutral-600 break-words whitespace-pre-wrap [overflow-wrap:anywhere]">
                <Prose html={mainDescription} />
              </div>
            </div>

            {/* Property Facts Section (Only for Buy/Sell) */}
            {product.listing_type === 'sell' && (
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-sm my-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center">
                  <Scaling className="w-5 h-5 mr-2 text-neutral-900" />
                  Property Facts
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Type</p>
                    <p className="text-sm font-bold text-neutral-900">{product.type || 'Property'}</p>
                  </div>
                  {product.builtUpArea && (
                    <div>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Built-up Area</p>
                      <p className="text-sm font-bold text-neutral-900">{product.builtUpArea} sq.ft</p>
                    </div>
                  )}
                  {product.total_area && (
                    <div>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Total Area</p>
                      <p className="text-sm font-bold text-neutral-900">{product.total_area}</p>
                    </div>
                  )}
                  {product.dimensions && (
                    <div>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Dimensions</p>
                      <p className="text-sm font-bold text-neutral-900">{product.dimensions}</p>
                    </div>
                  )}
                  {product.facing && (
                    <div>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Facing</p>
                      <p className="text-sm font-bold text-neutral-900">{product.facing}</p>
                    </div>
                  )}
                  {product.bhk && (
                    <div>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">BHK / Floor</p>
                      <p className="text-sm font-bold text-neutral-900">{product.bhk}</p>
                    </div>
                  )}
                  {product.property_age && (
                    <div>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Property Age</p>
                      <p className="text-sm font-bold text-neutral-900">{product.property_age}</p>
                    </div>
                  )}
                  {product.road_width && (
                    <div>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Road Width</p>
                      <p className="text-sm font-bold text-neutral-900">{product.road_width}</p>
                    </div>
                  )}
                  {product.shutter_width && (
                    <div>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Shutter Width</p>
                      <p className="text-sm font-bold text-neutral-900">{product.shutter_width}</p>
                    </div>
                  )}
                  {product.main_road_distance && (
                    <div>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Main Road Distance</p>
                      <p className="text-sm font-bold text-neutral-900">{product.main_road_distance}</p>
                    </div>
                  )}
                  
                  {/* Legal Status for Sell Properties */}
                  <div>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Registry</p>
                    <p className="text-sm font-bold text-neutral-900">{product.registry ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Diversion</p>
                    <p className="text-sm font-bold text-neutral-900">{product.diversion ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Mutation (Namantaran)</p>
                    <p className="text-sm font-bold text-neutral-900">{product.mutation ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Price Negotiable</p>
                    <p className="text-sm font-bold text-neutral-900">{product.negotiable ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Amenities Section (Refined UI: Active Only Grid) */}
            {hasAnyAmenity && (
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-sm my-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-neutral-900" />
                  Amenities & Features
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {activeAmenities.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.id} className="flex flex-col items-center justify-center p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 hover:bg-neutral-100 transition-all text-center gap-3 group">
                        <div className="w-10 h-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-900 shadow-sm group-hover:scale-110 transition-transform">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wide text-neutral-700">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                  {customAmenities.map((amenity) => (
                    <div key={amenity} className="flex flex-col items-center justify-center p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 hover:bg-neutral-100 transition-all text-center gap-3 group">
                      <div className="w-10 h-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-900 shadow-sm group-hover:scale-110 transition-transform">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wide text-neutral-700">
                        {amenity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}


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

              {/* Location Details Grid */}
              <div className="mb-6 p-4 bg-neutral-50 rounded-xl border border-neutral-100 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">State</p>
                    <p className="text-base font-bold text-neutral-900">{product.state || 'Madhya Pradesh'}</p>
                  </div>

                </div>
                <div>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Address / Area</p>
                  <p className="text-base font-medium text-neutral-900">
                    {product.address || product.locality || product.tags?.[2] || 'Address available on request'}
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

            {/* SEO Context (Auto-Generated Tags) - Rendered at the bottom for Google Bot mostly */}
            {seoSection && (
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-sm mt-6 mb-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-4">Property & Neighborhood Overview</h2>
                <div className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">
                  {seoSection}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: Sidebar (Desktop Sticky) */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-24 space-y-6">

              {/* Title */}
              <div>
                <h1 className="text-3xl font-medium font-serif text-neutral-800 mb-2 leading-tight flex items-start gap-3">
                  {product.title}
                  {(product as any).is_verified && (
                    <BadgeCheck className="w-8 h-8 text-blue-500 fill-blue-50 shrink-0 mt-0.5" aria-label="Verified Owner" />
                  )}
                </h1>
                <div className="flex items-center text-black text-sm mb-4 font-bold">
                  <MapPin className="w-4 h-4 mr-1 stroke-[2.5]" />
                  {(() => {
                    const loc = product.locality || product.tags?.[2] || product.address || product.location || '';
                    const city = product.city || '';
                    const parts = [loc, city].filter(Boolean);

                    // Dedupe
                    if (parts.length > 1 && parts[0]?.toLowerCase().includes((parts[1] || '').toLowerCase())) {
                      return parts[0];
                    }
                    return parts.join(', ');
                  })() || 'Location Unavailable'}
                </div>
              </div>

              {/* Price Card */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-sm text-neutral-500 font-medium mb-1">{product.listing_type === 'sell' ? 'Asking Price' : 'Monthly Rent'}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-neutral-900">
                        {formatPrice(product.price || product.priceRange?.minVariantPrice?.amount || '0', product.priceRange?.minVariantPrice?.currencyCode || 'INR')}
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
                {product.securityDeposit && product.listing_type !== 'sell' && (
                  <div className="flex items-center justify-between py-3 border-t border-neutral-100 mb-6">
                    <div className="flex items-center text-neutral-600 text-sm">
                      <ShieldCheck className="w-4 h-4 mr-2 text-neutral-400" />
                      Security Deposit
                    </div>
                    <span className="font-bold text-neutral-900">₹{Number(product.securityDeposit).toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* Contact + Share row */}
                <ContactOwner
                  product={product}
                  className="w-full"
                />

                <div className="flex items-center gap-2 mt-2">
                  <SharePropertyButton 
                    product={product}
                    variant="outline"
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all text-neutral-500 border-neutral-200 hover:border-neutral-400 hover:text-neutral-700"
                  />
                </div>

                <p className="text-xs text-center text-neutral-500 mt-4 font-medium">
                  No Booking Fees. Directly contact the owner and visit the property for free.
                </p>

                <div className="mt-6 pt-6 border-t border-neutral-100 text-center flex justify-center">
                  <ReportPropertyModal product={product} />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MOBILE STICKY FOOTER */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-neutral-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.08)] lg:hidden z-50 safe-area-bottom">
        <div className="flex items-center gap-2 px-3 py-2.5">
          {/* Price pill */}
          <div className="flex flex-col min-w-0 shrink-0">
            <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider leading-none mb-0.5">{product.listing_type === 'sell' ? 'Price' : 'Rent'}</p>
            <span className="text-base font-black text-neutral-900 leading-none">
              {formatPrice(product.price || product.priceRange?.minVariantPrice?.amount || '0', product.priceRange?.minVariantPrice?.currencyCode || 'INR')}
            </span>
          </div>

          <div className="flex-1 flex items-center gap-1.5">
            <ContactOwner
              product={product}
              className="flex-1 py-0"
            />
          </div>

          {/* Share icon button */}
          <SharePropertyButton
            product={product}
            variant="outline"
            className="p-2 h-auto w-auto aspect-square shrink-0 border-neutral-200 text-neutral-500 hover:text-neutral-800 rounded-xl"
          />

          {/* Report icon */}
          <ReportPropertyModal product={product} isIconOnly />
        </div>
      </div>

    </PageLayout>
  );
}
