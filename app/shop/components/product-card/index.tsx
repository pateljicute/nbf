import React from 'react';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Heart } from 'lucide-react';



export const ProductCard = ({ product, className }: { product: Product; className?: string }) => {
  return (
    <div className={cn('group flex flex-col bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300', className)}>
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        <Link href={`/product/${product.handle}`} className="block size-full" prefetch>
          <img
            src={product.featuredImage?.url || '/placeholder.svg'}
            alt={product.featuredImage?.altText || product.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        {/* Tag */}
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 bg-black/80 text-white text-[10px] font-bold uppercase tracking-wider rounded-full backdrop-blur-sm">
            {product.tags?.[0] || 'New'}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-col p-4 gap-3">
        <div className="space-y-1">
          <Link href={`/product/${product.handle}`} className="block">
            <h3 className="font-serif text-lg font-bold text-neutral-900 line-clamp-1 group-hover:text-black transition-colors">
              {product.title}
            </h3>
          </Link>
          <p className="text-sm text-neutral-500 line-clamp-1">
            {product.description || 'Premium Collection'}
          </p>
        </div>

        {/* Amenities / Features (Mocked based on image, or use tags) */}
        <div className="flex items-center gap-2 text-xs text-neutral-600 font-medium">
          <div className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16" /><path d="M2 8h18a2 2 0 0 1 2 2v10" /><path d="M2 17h20" /><path d="M6 8v9" /></svg>
            <span>In Stock</span>
          </div>
          <span className="text-neutral-300">•</span>
          <span>Fast Delivery</span>
        </div>

        {/* Price */}
        <div className="text-xl font-bold text-neutral-900">
          ₹{Number(product.priceRange.minVariantPrice.amount).toLocaleString('en-IN')}
          <span className="text-sm font-normal text-neutral-500 ml-1">/month</span>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 pt-3 mt-auto border-t border-neutral-100">
          <Link href={`/product/${product.handle}`} className="flex-1">
            <button className="w-full py-2.5 px-4 bg-white border border-neutral-200 text-neutral-900 text-sm font-semibold rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-all cursor-pointer">
              View Details
            </button>
          </Link>
          <button className="p-2.5 border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-all text-neutral-400 hover:text-red-500 cursor-pointer">
            <Heart className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
