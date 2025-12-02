'use client';

import { useProductImages, useSelectedOptions } from '@/components/products/variant-selector';
import { Product } from '@/lib/types';

export const ProductImage = ({ product }: { product: Product }) => {
  const selectedOptions = useSelectedOptions(product);

  const [variantImage] = useProductImages(product, selectedOptions);

  return (
    <img
      src={variantImage.url}
      alt={variantImage.altText || product.title}
      width={variantImage.width}
      height={variantImage.height}
      className="object-cover size-full"
    />
  );
};
