'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface ProductImageProps extends Omit<ImageProps, 'src'> {
    src?: string | null;
    fallbackSrc?: string;
}

export function ProductImage({
    src,
    fallbackSrc = '/placeholder.jpg',
    alt,
    ...props
}: ProductImageProps) {
    const [imgSrc, setImgSrc] = useState<string>(src || fallbackSrc);
    const [hasError, setHasError] = useState(false);

    return (
        <Image
            {...props}
            src={imgSrc}
            alt={alt || 'Product Image'}
            unoptimized
            loading={props.priority ? undefined : 'lazy'}
            onError={() => {
                if (!hasError) {
                    setHasError(true);
                    setImgSrc(fallbackSrc);
                }
            }}
        />
    );
}
