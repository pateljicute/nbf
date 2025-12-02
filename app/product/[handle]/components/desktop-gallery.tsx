'use client';

import { useProductImages, useSelectedOptions } from '@/components/products/variant-selector';
import { getOptimizedImageUrl } from '@/lib/cloudinary-utils';
import { Product } from '@/lib/types';
import { ProductImage } from '@/components/ui/product-image';

export const DesktopGallery = ({ product }: { product: Product }) => {
  const selectedOptions = useSelectedOptions(product);
  const images = useProductImages(product, selectedOptions);

  return images.map(image => (
    <ProductImage
      style={{
        aspectRatio: `${image.width} / ${image.height}`,
      }}
      key={`${image.url}-${image.selectedOptions?.map(o => `${o.name},${o.value}`).join('-')}`}
      src={getOptimizedImageUrl(image.url, 1200, undefined, 'limit')}
      fallbackSrc="/placeholder.jpg"
      alt={image.altText}
      width={image.width}
      height={image.height}
      className="w-full object-cover"
      quality={100}
    />
  ));
};
