'use client';

import React, { Suspense } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Collection } from '@/lib/types';
import Link from 'next/link';

import { CategoryFilter } from './category-filter';

import { useProducts } from '../providers/products-provider';
import { useFilterCount } from '../hooks/use-filter-count';

export function DesktopFilters({ collections, className }: { collections: Collection[]; className?: string }) {
  const { originalProducts } = useProducts();
  const filterCount = useFilterCount();

  return (
    <aside className={cn('grid sticky top-0 grid-cols-3 h-screen min-h-max pl-sides pt-top-spacing', className)}>
      <div className="flex flex-col col-span-3 xl:col-span-2 gap-8 pr-4 overflow-y-auto pb-24">
        <div className="flex justify-between items-baseline pl-2 -mb-2">
          <h2 className="text-2xl font-semibold">
            Filters
          </h2>
          <Button
            size={'sm'}
            variant="ghost"
            aria-label="Clear all filters"
            className="font-medium text-foreground/50 hover:text-foreground/60"
            asChild
          >
            <Link href="/shop" prefetch>
              Clear
            </Link>
          </Button>
        </div>

        {/* Price Filter Added Here */}
        <div className="border-b border-neutral-100 pb-8">
          <Suspense fallback={null}>
            {/* Dynamic Import or direct usage if compatible */}
            <PriceFilterWrapper />
          </Suspense>
        </div>

        <div className="pb-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-4">Categories</h3>
          <Suspense fallback={null}>
            <CategoryFilter collections={collections} />
          </Suspense>
        </div>
      </div>
    </aside>
  );
}

// Wrapper to import PriceFilter dynamically or safely if it uses context
import { PriceFilter } from '@/components/shop/price-filter';
function PriceFilterWrapper() {
  return <PriceFilter />;
}
