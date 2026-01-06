'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Share2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { LoginModal } from '@/components/auth/login-modal';
import { ShareModal } from '@/components/ui/share-modal';
import { ProductImage } from '@/components/ui/product-image';

export const ProductCard = ({ product, className }: { product: Product; className?: string }) => {
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const router = useRouter();

  const handleShare = async (product: Product) => {
    try {
      const shareData = {
        title: product.title,
        text: `Check out this property: ${product.description}\nPrice: ₹${Number(product.priceRange.minVariantPrice.amount).toLocaleString('en-IN')}/month`,
        url: `${window.location.origin}/product/${product.handle}`
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Show custom share modal instead of browser alert
        setShowShareModal(true);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Show custom share modal on error as well
      setShowShareModal(true);
    }
  };

  const handleProductClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setShowLoginModal(true);
    }
  };

  return (
    <>
      <div className={cn('group flex flex-col bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300', className)}>
        {/* Image Section */}
        <div className="relative aspect-[3/2] md:aspect-[4/3] overflow-hidden bg-neutral-100">
          <Link href={`/product/${product.handle}`} className="block size-full" onClick={handleProductClick}>
            <ProductImage
              src={product.featuredImage?.url || '/placeholder.svg'}
              alt={product.featuredImage?.altText || product.title}
              fill
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
              <h3 className="font-serif text-base md:text-lg font-bold text-neutral-900 line-clamp-1 group-hover:text-black transition-colors">
                {product.title}
              </h3>
            </Link>
            <p className="text-xs md:text-sm text-neutral-500 line-clamp-1">
              {product.description || 'Premium Collection'}
            </p>
          </div>

          {/* Amenities / Features (Mocked based on image, or use tags) */}
          <div className="flex items-center gap-2 text-[10px] md:text-xs text-neutral-600 font-medium">
            <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 md:w-3.5 md:h-3.5"><path d="M2 4v16" /><path d="M2 8h18a2 2 0 0 1 2 2v10" /><path d="M2 17h20" /><path d="M6 8v9" /></svg>
              <span>In Stock</span>
            </div>
            <span className="text-neutral-300">•</span>
            <span>Fast Delivery</span>
          </div>

          {/* Price */}
          <div className="text-lg md:text-xl font-bold text-neutral-900">
            ₹{Number(product.priceRange.minVariantPrice.amount).toLocaleString('en-IN')}
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
                e.stopPropagation();
                handleShare(product);
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
        propertyTitle={product.title}
        propertyUrl={`/product/${product.handle}`}
      />
    </>
  );
};

