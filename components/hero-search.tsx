'use client';

import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, FormEvent } from 'react';

export function HeroSearch() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/shop?q=${encodeURIComponent(query)}`);
        } else {
            router.push('/shop');
        }
    };

    return (
        <div className="mt-4 w-full max-w-md">
            <form
                onSubmit={handleSearch}
                className="flex items-center justify-between w-full p-1.5 md:p-2 bg-white rounded-full hover:bg-white/90 transition-all group/btn shadow-lg"
            >
                <div className="flex-1 flex items-center pl-4 md:pl-6">
                    <Search className="w-4 h-4 md:w-5 md:h-5 text-neutral-400 mr-2 md:mr-3" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by location..."
                        className="w-full bg-transparent border-none focus:outline-none text-neutral-800 placeholder:text-neutral-500 font-medium text-sm md:text-base"
                    />
                </div>
                <button
                    type="submit"
                    className="px-6 py-2.5 md:px-8 md:py-3 bg-black text-white text-sm md:text-base font-bold rounded-full transition-transform group-hover/btn:scale-105 cursor-pointer"
                >
                    Search
                </button>
            </form>
        </div>
    );
}
