'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { IndianRupee, X } from 'lucide-react';

export function PriceFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Parse current price range
    const currentMin = searchParams.get('minPrice');
    const currentMax = searchParams.get('maxPrice');

    // Define Filter Options with precise ranges
    const filters = [
        {
            label: 'Low Budget',
            min: undefined,
            max: '3000',
            desc: '< ₹3k',
            active: !currentMin && currentMax === '3000'
        },
        {
            label: 'Mid Range',
            min: '3000',
            max: '7000',
            desc: '₹3k - ₹7k',
            active: currentMin === '3000' && currentMax === '7000'
        },
        {
            label: 'High Range',
            min: '7000',
            max: undefined,
            desc: '> ₹7k',
            active: currentMin === '7000' && !currentMax
        },
    ];

    const handleFilter = (min?: string, max?: string) => {
        const params = new URLSearchParams(searchParams.toString());

        // Clear existing price params
        params.delete('minPrice');
        params.delete('maxPrice');

        // Set new params if selected
        if (min) params.set('minPrice', min);
        if (max) params.set('maxPrice', max);

        // Reset to page 1
        params.delete('page');

        router.push(`/properties?${params.toString()}`);
    };

    const clearFilter = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('minPrice');
        params.delete('maxPrice');
        params.delete('page');
        router.push(`/properties?${params.toString()}`);
    }

    const hasActiveFilter = !!currentMin || !!currentMax;

    return (
        <div className="w-full mb-8">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-medium tracking-wide text-neutral-900 flex items-center gap-2">
                        <IndianRupee className="w-4 h-4" />
                        Price Range
                    </h3>
                    {hasActiveFilter && (
                        <button
                            onClick={clearFilter}
                            className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-neutral-500 hover:text-red-600 transition-colors bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-full"
                        >
                            <X className="w-3 h-3" />
                            Clear
                        </button>
                    )}
                </div>

                <div className="flex overflow-x-auto pb-4 -mx-5 px-5 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-3 gap-3 scrollbar-hide">
                    {filters.map((f) => (
                        <button
                            key={f.label}
                            onClick={() => handleFilter(f.min, f.max)}
                            className={cn(
                                "flex-shrink-0 flex flex-col items-center justify-center p-4 min-w-[140px] rounded-2xl border transition-all duration-300 group",
                                f.active
                                    ? "bg-neutral-900 border-neutral-900 shadow-xl shadow-neutral-900/10 transform scale-[1.02]"
                                    : "bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-md"
                            )}
                        >
                            <span className={cn(
                                "text-xs font-bold uppercase tracking-wider text-center mb-1.5 transition-colors",
                                f.active ? "text-white" : "text-neutral-900"
                            )}>
                                {f.label}
                            </span>
                            <span className={cn(
                                "text-xs font-medium transition-colors",
                                f.active ? "text-neutral-400" : "text-neutral-500 group-hover:text-neutral-700"
                            )}>
                                {f.desc}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
