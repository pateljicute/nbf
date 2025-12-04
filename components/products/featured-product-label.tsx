'use client';

import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { Product } from '@/lib/types';
import { ContactOwner } from './contact-owner';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { LoginModal } from '@/components/auth/login-modal';

export function FeaturedProductLabel({
  product,
  principal = false,
  className,
}: {
  product: Product;
  principal?: boolean;
  className?: string;
}) {
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleProductClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setShowLoginModal(true);
    }
  };

  if (principal) {
    return (
      <div
        className={cn(
          'flex flex-col grid-cols-2 gap-y-3 p-4 w-full bg-white md:w-fit md:rounded-md md:grid',
          className
        )}
      >
        <div className="col-span-2">
          <Badge className="font-black capitalize rounded-full">Best Seller</Badge>
        </div>
        <Link href={`/product/${product.handle}`} className="col-span-1 self-start text-2xl font-semibold" onClick={handleProductClick}>
          {product.title}
        </Link>
        <div className="col-span-1 mb-10">
          {product.tags && product.tags.length > 0 ? (
            <p className="mb-3 text-sm italic font-medium">{product.tags.join('. ')}</p>
          ) : null}
          <p className="text-sm font-medium line-clamp-3">{product.description}</p>
        </div>
        <div className="flex col-span-1 gap-3 items-center text-2xl font-semibold md:self-end">
          ₹{Number(product.priceRange.minVariantPrice.amount).toLocaleString('en-IN')}
          {product.compareAtPrice && (
            <span className="line-through opacity-30">₹{Number(product.compareAtPrice.amount)}</span>
          )}
        </div>
        <ContactOwner className="flex gap-20 justify-between pr-2" product={product} />
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      </div>
    );
  }

  return (
    <div className={cn('flex gap-2 items-center p-2 pl-8 bg-white rounded-md max-w-full', className)}>
      <div className="pr-6 leading-4 overflow-hidden">
        <Link
          href={`/product/${product.handle}`}
          className="inline-block w-full truncate text-base font-semibold opacity-80 mb-1.5"
          onClick={handleProductClick}
        >
          {product.title}
        </Link>
        <div className="flex gap-2 items-center text-base font-semibold">
          ₹{Number(product.priceRange.minVariantPrice.amount).toLocaleString('en-IN')}
          {product.compareAtPrice && (
            <span className="text-sm line-through opacity-30">₹{Number(product.compareAtPrice.amount)}</span>
          )}
        </div>
      </div>
      <ContactOwner product={product} />
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}


