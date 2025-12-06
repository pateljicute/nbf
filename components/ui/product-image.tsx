'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';
import cloudinaryLoader from '@/lib/cloudinary-loader';
import { cn } from '@/lib/utils';

interface ProductImageProps extends Omit<ImageProps, 'src'> {
  src?: string | null;
  fallbackSrc?: string;
  className?: string;
}

export function ProductImage({
  src,
  fallbackSrc = '/placeholder.jpg',
  alt,
  fill,
  priority,
  className,
  sizes,
  width,
  height,
  onError,
  ...props
}: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);

  const resolvedSizes = sizes || (fill ? '100vw' : '100vw');
  const resolvedWidth = width || (fill ? undefined : 800);
  const resolvedHeight = height || (fill ? undefined : 600);

  return (
    <Image
      {...props}
      loader={cloudinaryLoader}
      src={imgSrc}
      alt={alt || 'Product Image'}
      fill={fill}
      width={resolvedWidth}
      height={resolvedHeight}
      className={cn(fill ? 'absolute inset-0 w-full h-full' : '', 'object-cover', className)}
      priority={priority}
      sizes={resolvedSizes}
      onError={(e) => {
        onError?.(e);
        if (!hasError) {
          setHasError(true);
          setImgSrc(fallbackSrc);
        }
      }}
    />
  );
}
