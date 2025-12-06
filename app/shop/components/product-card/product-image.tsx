'use client';

import { useProductImages, useSelectedOptions } from '@/components/products/variant-selector';
import { Product } from '@/lib/types';
import { ProductImage as BaseProductImage } from '@/components/ui/product-image';

export const ProductVariantImage = ({ product }: { product: Product }) => {
  const selectedOptions = useSelectedOptions(product);
  const [variantImage] = useProductImages(product, selectedOptions);

  if (!variantImage) return null;

  return (
    <BaseProductImage
      src={variantImage.url}
      alt={variantImage.altText || product.title}
      width={variantImage.width || 800}
      height={variantImage.height || 600}
      className="object-cover size-full"
      sizes="(max-width: 768px) 100vw, 50vw"
    />
  );
};
