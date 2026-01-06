'use client';

import { useState } from 'react';
import { useProductImages, useSelectedOptions } from '@/components/products/variant-selector';
import { getOptimizedImageUrl } from '@/lib/cloudinary-utils';
import { Product, Image } from '@/lib/types';
import { ProductImage } from '@/components/ui/product-image';
import { cn } from '@/lib/utils';

export const DesktopGallery = ({ product }: { product: Product }) => {
  const selectedOptions = useSelectedOptions(product);
  const images = useProductImages(product, selectedOptions);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images.length) return null;

  const selectedImage = images[selectedIndex] || images[0];

  return (
    <div className="flex gap-4 h-[600px] w-full">
      {/* Thumbnails Strip (Left) */}
      <div className="flex flex-col gap-3 w-20 h-full overflow-y-auto scrollbar-hide py-1">
        {images.map((image: Image, index: number) => {
          const isSelected = index === selectedIndex;
          return (
            <button
              key={`${image.url}-${index}`}
              onClick={() => setSelectedIndex(index)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={cn(
                "relative w-full aspect-square flex-shrink-0 rounded-md overflow-hidden border-2 transition-all",
                isSelected
                  ? "border-neutral-900 ring-1 ring-neutral-900/20"
                  : "border-transparent hover:border-neutral-300"
              )}
            >
              <ProductImage
                src={getOptimizedImageUrl(image.url, 100, 100, 'fill')}
                fallbackSrc="/placeholder.jpg"
                alt={`Room for rent in ${product.tags?.[1] || 'Mandsaur'} - ${product.title} NBF Homes`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          );
        })}
      </div>

      {/* Main Image (Right) */}
      <div className="relative flex-1 h-full bg-neutral-50 rounded-xl overflow-hidden border border-neutral-100">
        <ProductImage
          key={selectedImage.url}
          src={getOptimizedImageUrl(selectedImage.url, 1200, undefined, 'limit')}
          fallbackSrc="/placeholder.jpg"
          alt={`Room for rent in ${product.tags?.[1] || 'Mandsaur'} - ${product.title} NBF Homes`}
          fill
          className="object-contain p-2"
          sizes="(max-width: 1024px) 100vw, 60vw"
          priority={false}
        />
      </div>
    </div>
  );
};

