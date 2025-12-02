'use client';

import { useState, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ProductImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    src?: string | null;
    fallbackSrc?: string;
    fill?: boolean;
    priority?: boolean;
    unoptimized?: boolean; // Keep for compatibility but ignore
}

export function ProductImage({
    src,
    fallbackSrc = '/placeholder.jpg',
    alt,
    fill,
    priority,
    className,
    unoptimized,
    width,
    height,
    ...props
}: ProductImageProps) {
    const [imgSrc, setImgSrc] = useState<string | undefined>(src || fallbackSrc);
    const [hasError, setHasError] = useState(false);

    const fillStyles = fill ? "absolute inset-0 w-full h-full" : "";

    return (
        <img
            {...props}
            src={imgSrc}
            alt={alt || 'Product Image'}
            width={width}
            height={height}
            className={cn(fillStyles, className, "object-cover")}
            loading={priority ? "eager" : "lazy"}
            onError={() => {
                if (!hasError) {
                    setHasError(true);
                    setImgSrc(fallbackSrc);
                }
            }}
        />
    );
}
