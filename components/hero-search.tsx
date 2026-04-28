'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface HeroSearchProps {
    onSearch?: (query: string) => void;
    cities?: { name: string; count: number }[];
    mode?: string;
}

export function HeroSearch({ onSearch, cities = [], mode = 'rent' }: HeroSearchProps) {
    const router = useRouter();
    const [query, setQuery] = useState('');

    const handleSearch = (e?: React.FormEvent, customQuery?: string) => {
        if (e) e.preventDefault();
        const finalQuery = customQuery ?? query;
        
        if (onSearch) {
            onSearch(finalQuery);
        } else if (finalQuery.trim()) {
            router.push(`/properties?query=${encodeURIComponent(finalQuery.trim())}`);
        } else {
            router.push('/search');
        }
    };

    const isSell = mode === 'sell';

    return (
        <div className="mt-4 w-full md:w-full max-w-2xl relative z-50 mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-4">
            <form
                onSubmit={handleSearch}
                className="flex flex-row items-center justify-between w-full p-1.5 md:p-2 bg-white rounded-xl hover:bg-white/95 transition-all shadow-xl border border-neutral-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10"
            >
                <div className="flex-1 flex items-center pl-3">
                    <Search className="w-5 h-5 text-neutral-400 mr-3 shrink-0" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={isSell
                            ? 'Search by City, Area or Property Type...'
                            : 'Search by City, Locality or Project...'}
                        className="w-full bg-transparent text-sm md:text-base font-medium text-neutral-800 placeholder:text-neutral-400 focus:outline-none py-2"
                    />
                </div>
                <button
                    type="submit"
                    className="shrink-0 px-6 py-2.5 bg-neutral-900 hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors ml-2"
                >
                    Search
                </button>
            </form>

            {/* Dynamic City Selector */}
            {cities.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
                    <span className="text-white/60 text-xs font-bold uppercase tracking-wider shrink-0 mr-1">
                        {isSell ? 'Buy In:' : 'Popular:'}
                    </span>
                    {cities.map((city) => (
                        <button
                            key={city.name}
                            onClick={() => {
                                setQuery(city.name);
                                handleSearch(undefined, city.name);
                            }}
                            className="shrink-0 px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-full text-white text-xs font-medium transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            {city.name}
                            <span className="opacity-60 text-[10px] bg-white/20 px-1.5 rounded-full">{city.count}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
