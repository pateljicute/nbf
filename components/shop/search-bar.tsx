'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import { useState, useEffect, useTransition } from 'react';

export function SearchBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSearch = searchParams.get('q') || searchParams.get('search') || '';

    const [value, setValue] = useState(currentSearch);
    const [debouncedValue, setDebouncedValue] = useState(currentSearch);
    const [isPending, startTransition] = useTransition();

    // Debounce logic
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [value]);

    // Sync debounced value to URL
    useEffect(() => {
        // Should not trigger on initial mount if values match
        if (debouncedValue === currentSearch) return;

        const params = new URLSearchParams(searchParams.toString());
        if (debouncedValue) {
            params.set('q', debouncedValue);
            params.delete('search');
        } else {
            params.delete('q');
            params.delete('search');
        }
        params.delete('page');

        startTransition(() => {
            router.push(`/properties?${params.toString()}`);
        });
    }, [debouncedValue, router, searchParams, currentSearch]);

    const handleSearch = (term: string) => {
        // If user clicks Search button, force immediate update (bypass debounce wait if any)
        const params = new URLSearchParams(searchParams.toString());
        if (term) {
            params.set('q', term);
            params.delete('search');
        } else {
            params.delete('q');
            params.delete('search');
        }
        params.delete('page');

        startTransition(() => {
            router.push(`/properties?${params.toString()}`);
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch(value);
        }
    };

    return (
        <div className="w-full relative mb-4 max-w-[95%] mx-auto md:max-w-full md:mx-0">
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search by Locality, City or Project..."
                    disabled={isPending}
                    className="w-full pl-11 pr-10 py-3.5 bg-white border border-neutral-200 rounded-2xl text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                    {isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin text-neutral-900" />
                    ) : (
                        <Search className="w-5 h-5" />
                    )}
                </div>
                {value && !isPending && (
                    <button
                        onClick={() => {
                            setValue('');
                            handleSearch('');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 rounded-full text-neutral-400 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
            <div className="mt-2 flex justify-end">
                <button
                    onClick={() => handleSearch(value)}
                    disabled={isPending}
                    className="text-xs font-bold uppercase tracking-wider bg-neutral-900 text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors disabled:bg-neutral-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isPending ? 'Searching...' : 'Search'}
                </button>
            </div>
        </div>
    );
}
