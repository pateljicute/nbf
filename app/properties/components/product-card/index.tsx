'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Share2, MapPin, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { LoginModal } from '@/components/auth/login-modal';
import { ShareModal } from '@/components/ui/share-modal';
import { ProductImage } from '@/components/ui/product-image';

export const ProductCard = ({ product, className }: { product: Product; className?: string }) => {
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const router = useRouter();

  const city = product.tags?.[1] || '';
  const address = product.tags?.[2] || '';
  // Simple heuristic to get "Area": take the part after "House No..." or first two parts if simple.
  // For now, using the full address truncated as requested, but formatted.
  // User example: "Patel Nagar, Mandsaur".
  // If address is "House No. 22, Patel Nagar...", we might want to just show it all truncated.

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

  return (
    <>
      <div className={cn('group flex flex-col bg-white border border-neutral-200 rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300', className)}>
        {/* Image Section */}
        <div className="relative aspect-[3/2] md:aspect-[4/3] overflow-hidden bg-neutral-100">
          <Link href={`/product/${product.handle}`} className="block size-full" onClick={handleProductClick}>
            <ProductImage
              src={product.featuredImage?.url || '/placeholder.svg'}
              alt={product.featuredImage?.altText || product.title}
              fill
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAfhAJ/wlseKgAAAABJRU5ErkJggg=="
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          </Link>
          {/* Tag */}
          <div className="absolute top-2 right-2 md:top-3 md:right-3">
            <span className="px-2 py-0.5 md:px-3 md:py-1 bg-black/80 text-white text-[9px] md:text-[10px] font-bold uppercase tracking-wider rounded-full backdrop-blur-sm">
              {product.tags?.[0] || 'New'}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col p-3 md:p-4 gap-2 md:gap-3">
          <div className="space-y-0.5 md:space-y-1">
            <Link href={`/product/${product.handle}`} className="block" onClick={handleProductClick}>
              <h3 className="font-serif text-base md:text-lg font-medium text-neutral-900 line-clamp-1 group-hover:text-black transition-colors">
                {product.title}
              </h3>
            </Link>

            {/* Improved Location UI */}
            <div className="flex items-center gap-1 text-black mt-1 font-bold">
              <MapPin className="size-3.5 md:size-4 shrink-0 stroke-[2.5]" />
              <p className="text-xs md:text-sm line-clamp-1">
                {(() => {
                  let cleanAddress = address || '';

                  // 1. Remove house/flat prefixes
                  cleanAddress = cleanAddress.replace(/^(?:House|Flat|Shop|Plot|Room)?\s*(?:No\.?|Number)?\s*[\d\w\/-]+\s*,?\s*/i, '');

                  // 2. Remove City from address if present
                  if (city && cleanAddress.toLowerCase().includes(city.toLowerCase())) {
                    cleanAddress = cleanAddress.replace(new RegExp(city, 'gi'), '').replace(/,\s*$/, '').trim();
                  }

                  // 3. Clean leading/trailing commas
                  cleanAddress = cleanAddress.replace(/^[\s,]+|[\s,]+$/g, '');

                  // 4. Smart Join
                  const parts = [cleanAddress, city].filter(Boolean);

                  // Dedupe if cleanAddress already includes city (case-insensitive)
                  if (parts.length > 1 && parts[0]?.toLowerCase().includes((parts[1] || '').toLowerCase())) {
                    return parts[0];
                  }

                  return parts.join(', ');
                })()}
              </p>
            </div>
          </div>

          {/* Status & Verified Owner */}
          <div className="flex items-center gap-3 text-[10px] md:text-xs text-neutral-500 font-medium">
            <span className="flex items-center gap-1.5 text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
              </span>
              Available
            </span>
            <span className="flex items-center gap-1 text-neutral-600">
              <CheckCircle2 className="size-3.5 text-blue-500" />
              Verified Owner
            </span>
          </div>

          {/* Price */}
          <div className="text-lg md:text-xl font-bold text-neutral-900">
            ₹{Number(product.price || product.priceRange?.minVariantPrice?.amount || 0).toLocaleString('en-IN')}
            <span className="text-xs md:text-sm font-normal text-neutral-500 ml-1">/month</span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-2 md:gap-3 pt-2 md:pt-3 mt-auto border-t border-neutral-100">
            <Link href={`/product/${product.handle}`} className="flex-1" onClick={handleProductClick}>
              <button className="w-full py-2 px-3 md:py-2.5 md:px-4 bg-white border border-neutral-200 text-neutral-900 text-xs md:text-sm font-semibold rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-all cursor-pointer">
                View Details
              </button>
            </Link>
            <button
              className="p-2 md:p-2.5 border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-all text-neutral-400 hover:text-blue-500 cursor-pointer"
              onClick={(e) => {
                handleShare(e, product);
              }}
              title="Share this property"
            >
              <Share2 className="size-4 md:size-5" />
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
};

