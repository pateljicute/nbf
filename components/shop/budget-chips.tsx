'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTransition } from 'react';

const BUDGET_RANGES = [
    { label: 'Low Budget', subLabel: '< ₹3k', min: 0, max: 3000, color: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-50' },
    { label: 'Mid Range', subLabel: '₹3k - ₹7k', min: 3000, max: 7000, color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-50' },
    { label: 'High Range', subLabel: '> ₹7k', min: 7000, max: 100000, color: 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-50' },
];

export function BudgetChips() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const currentMin = searchParams.get('minPrice');
    const currentMax = searchParams.get('maxPrice');

    const handleSelect = (min: number, max: number) => {
        const params = new URLSearchParams(searchParams.toString());

        // Toggle logic: If clicking active chip, remove filter
        if (currentMin === min.toString() && currentMax === max.toString()) {
            params.delete('minPrice');
            params.delete('maxPrice');
        } else {
            params.set('minPrice', min.toString());
            params.set('maxPrice', max.toString());
        }

        startTransition(() => {
            router.push(`/properties?${params.toString()}`);
        });
    };

    return (
        <div className="flex flex-row md:flex-col gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <div className="md:hidden text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1 px-1 shrink-0 flex items-center">
                Budget
            </div>
            <p className="hidden md:block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2 px-1">
                Filter by Budget
            </p>

            {BUDGET_RANGES.map((range) => {
                const isActive = currentMin === range.min.toString() && currentMax === range.max.toString();

                return (
                    <button
                        key={range.label}
                        onClick={() => handleSelect(range.min, range.max)}
                        disabled={isPending}
                        className={cn(
                            "group relative flex items-center justify-between px-3 py-1.5 md:py-2 rounded-full border transition-all shrink-0 whitespace-nowrap md:whitespace-normal w-auto md:w-full text-left",
                            isActive ? "ring-2 ring-offset-1 ring-neutral-900 shadow-sm" : "opacity-80 hover:opacity-100",
                            range.color
                        )}
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-2">
                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide">
                                {range.label}
                            </span>
                            <span className="text-[10px] md:text-xs font-medium opacity-80 bg-white/50 px-1.5 rounded-md">
                                {range.subLabel}
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
