'use client';

import { cn } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/cloudinary-utils';
import { ProductImage } from '@/components/ui/product-image';
import { Product } from '@/lib/types';
import Link from 'next/link';
import { Share2, MapPin } from 'lucide-react';
import { HeroSearch } from '../hero-search';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { LoginModal } from '@/components/auth/login-modal';
import Image from 'next/image';
import cloudinaryLoader from '@/lib/cloudinary-loader';
import { ShareModal } from '@/components/ui/share-modal';

interface LatestProductCardProps {
  product: Product;
  principal?: boolean;
  className?: string;
  labelPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function LatestProductCard({
  product,
  principal = false,
  className,
  labelPosition = 'bottom-right',
}: LatestProductCardProps) {
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleShare = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    setShowShareModal(true);
  };

  const handleProductClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setShowLoginModal(true);
    }
  };

  if (principal) {
    return (
      <div className={cn('relative h-screen w-full overflow-hidden group', className)}>
        <Link href={`/product/${product.handle}`} className="size-full block" onClick={handleProductClick}>
          <Image
            loader={cloudinaryLoader}
            src="https://res.cloudinary.com/dilccqhro/image/upload/v1764658021/hero-background_jdgiur.jpg"
            alt="Hero Background"
            fill
            priority
            sizes="100vw"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Darker overlay for better text contrast matching the reference */}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
        </Link>

        {/* Centered Content Container */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="flex flex-col items-center gap-6 animate-in slide-in-from-bottom-10 fade-in duration-700 delay-100 max-w-4xl">
            {/* Glassmorphic Badge */}
            <div className="flex items-center gap-3">
              <span className="px-4 py-1.5 border border-white/20 bg-white/10 backdrop-blur-md text-white text-xs font-medium uppercase tracking-widest rounded-full">
                #1 Best Selling Collection
              </span>
            </div>

            {/* Hero Title - Large & Elegant */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium text-white tracking-tight leading-[1.1] drop-shadow-lg">
              {product.title}
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-white/90 max-w-2xl font-light leading-relaxed drop-shadow-md">
              {product.description}
            </p>

            {/* CTA Button mimicking the search bar prominence */}
            {/* Functional Search Bar */}
            <HeroSearch />
          </div>
        </div>

        {/* Bottom Stats Row */}
        <div className="absolute bottom-0 left-0 w-full py-12 z-20 border-t border-white/10 bg-gradient-to-t from-black/80 to-transparent">
          <div className="container mx-auto grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col gap-1">
              <span className="text-2xl md:text-3xl font-bold text-white">10k+</span>
              <span className="text-xs md:text-sm text-white/70 uppercase tracking-wider">Active Listings</span>
            </div>
            <div className="flex flex-col gap-1 border-l border-white/20">
              <span className="text-2xl md:text-3xl font-bold text-white">50+</span>
              <span className="text-xs md:text-sm text-white/70 uppercase tracking-wider">Cities Covered</span>
            </div>
            <div className="flex flex-col gap-1 border-l border-white/20">
              <span className="text-2xl md:text-3xl font-bold text-white">0%</span>
              <span className="text-xs md:text-sm text-white/70 uppercase tracking-wider">Brokerage Fee</span>
            </div>
          </div>
        </div>
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      </div>
    );
  }

  return (
    <>
      <div className={cn('group flex flex-col bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300', className)}>
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
          <Link href={`/product/${product.handle}`} className="block size-full relative" onClick={handleProductClick}>
            <ProductImage
              src={getOptimizedImageUrl(product.featuredImage?.url || '', 800, 600, 'fill')}
              fallbackSrc="/placeholder.jpg"
              /* SEO Optimized Alt Text */
              alt={`${product.title} - NBF Homes`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              suppressHydrationWarning
            />
          </Link>
          {/* Tag */}
          <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
            <span className={cn(
              "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full backdrop-blur-sm",
              product.listing_type === 'sell' ? 'bg-[#e8202a] text-white' : 'bg-black/80 text-white'
            )}>
              {product.listing_type === 'sell' ? 'FOR SALE' : 'FOR RENT'}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col p-4 gap-3">
          <div className="space-y-1">
            <Link href={`/product/${product.handle}`} className="block" onClick={handleProductClick}>
              <h3 className="font-serif text-lg font-bold text-neutral-900 line-clamp-1 group-hover:text-black transition-colors flex items-center gap-1.5">
                {product.title}
                {product.is_verified && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-500 shrink-0" aria-label="Verified Owner">
                    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                  </svg>
                )}
              </h3>
            </Link>

            {/* Improved Location UI */}
            <div className="flex items-center gap-1 text-black my-0.5 font-bold">
              <MapPin className="size-3.5 shrink-0 stroke-[2.5]" />
              <p className="text-xs line-clamp-1">
                {/* Address Display Logic */}
                {(() => {
                  const city = product.city;
                  let area = product.locality;
                  let rawAddress = product.address || '';

                  // Fallback to parsing tags if locality is missing
                  if (!area && product.tags?.[2]) {
                    area = product.tags[2]
                      .replace(/^(?:Ward|House|Flat|Shop|Plot|Room|Street)?\s*(?:No\.?|Number)?\s*[\d\w\/-]+\s*,?\s*/i, '')
                      .replace(new RegExp(city || '', 'gi'), '')
                      .split(',')[0]
                      .trim();
                  }

                  // Fallback to address parsing if still empty
                  if (!area && rawAddress) {
                    // Remove house no etc from raw address first
                    rawAddress = rawAddress.replace(/^(?:House|Flat|Shop|Plot|Room)?\s*(?:No\.?|Number)?\s*[\d\w\/-]+\s*,?\s*/i, '');
                    area = rawAddress.split(',')[0].trim();
                  }

                  const parts = [area, city].filter(Boolean);
                  // Dedupe if area contains city
                  if (parts.length > 1 && parts[0]?.toLowerCase().includes((parts[1] || '').toLowerCase())) {
                    return parts[0];
                  }

                  return parts.join(', ');
                })()}
              </p>
            </div>

            <p className="text-sm text-neutral-500 line-clamp-1">
              {product.description || 'Premium Collection'}
            </p>
          </div>

          {/* Amenities / Features */}
          <div className="flex items-center flex-wrap gap-2 text-[10px] text-neutral-600 font-medium">
            {product.furnishingStatus && (
              <div className="flex items-center gap-1 bg-neutral-100 px-2 py-1 rounded-full">
                <span className="capitalize">{product.furnishingStatus.replace('_', ' ')}</span>
              </div>
            )}
            {product.builtUpArea && (
              <div className="flex items-center gap-1 bg-neutral-100 px-2 py-1 rounded-full">
                <span>{product.builtUpArea} sq.ft</span>
              </div>
            )}
            {product.amenities && product.amenities.length > 0 && (
              <div className="flex items-center gap-1 bg-neutral-100 px-2 py-1 rounded-full">
                <span>+{product.amenities.length} Amenities</span>
              </div>
            )}
            {(!product.furnishingStatus && !product.builtUpArea && (!product.amenities || product.amenities.length === 0)) && (
              <div className="flex items-center gap-1 text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                <span>Available</span>
              </div>
            )}
          </div>

          <div className="flex flex-col">
            {product.original_price && (
              <span className="text-xs text-neutral-400 line-through font-medium">
                ₹{Number(product.original_price).toLocaleString('en-IN')}
              </span>
            )}
            <div className="text-xl font-bold text-neutral-900">
              ₹{Number(product.price || product.priceRange?.minVariantPrice?.amount || 0).toLocaleString('en-IN')}
              {product.listing_type !== 'sell' && (
                <span className="text-sm font-normal text-neutral-500 ml-1">/month</span>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-3 pt-3 mt-auto border-t border-neutral-100">
            <Link href={`/product/${product.handle}`} className="flex-1" onClick={handleProductClick}>
              <button className="w-full py-2.5 px-4 bg-white border border-neutral-200 text-neutral-900 text-sm font-semibold rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-all cursor-pointer">
                View Details
              </button>
            </Link>
            <button
              className="p-2.5 border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-all text-neutral-400 hover:text-blue-500 cursor-pointer"
              onClick={(e) => {
                handleShare(e, product);
              }}
              title="Share this property"
            >
              <Share2 className="size-5" />
            </button>
          </div>
        </div>
      </div>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        product={product}
      />
    </>
  );
}

