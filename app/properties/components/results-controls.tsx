import { Collection, Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ShopBreadcrumb } from './shop-breadcrumb';
import { ResultsCount } from './results-count';
import { SortDropdown } from './sort-dropdown';
import { AdvancedFiltersWrapper } from './advanced-filters-wrapper';

export default function ResultsControls({
  collections,
  products,
  className,
}: {
  collections: Pick<Collection, 'handle' | 'title'>[];
  products: Product[];
  className?: string;
}) {
  return (
    <div className={cn('sticky top-24 z-30 flex flex-wrap items-center justify-between gap-4 mb-8 py-3 px-5 bg-white/80 backdrop-blur-xl border border-white/20 shadow-sm rounded-full transition-all', className)}>
      {/* Breadcrumb & Count */}
      <div className="flex items-center gap-4 pl-2">
        <ShopBreadcrumb collections={collections} className="text-sm font-medium" />
        <div className="w-px h-4 bg-neutral-200" />
        <ResultsCount count={products.length} />
      </div>

      <div className="flex items-center gap-3">
        {/* Advanced Filters */}
        <AdvancedFiltersWrapper />

        {/* Sort dropdown */}
        <div>
          <SortDropdown />
        </div>
      </div>
    </div>
  );
}
