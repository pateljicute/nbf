'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function HeroSearch() {
    const router = useRouter();

    return (
        <div className="mt-4 w-full md:w-full max-w-2xl relative z-50 mx-auto">
            <button
                onClick={() => router.push('/search')}
                className="relative group/btn w-full text-left"
            >
                <div className="flex flex-row items-center justify-between w-full p-1.5 md:p-2 bg-white rounded-xl hover:bg-white/95 transition-all shadow-md border border-neutral-200 hover:border-blue-300">
                    <div className="flex-1 flex items-center pl-3">
                        <Search className="w-5 h-5 text-neutral-400 mr-3 shrink-0" />
                        <div className="flex flex-col py-1">
                            <span className="text-sm md:text-base font-medium text-neutral-400">Search for properties...</span>
                            <span className="text-[10px] md:text-xs text-neutral-400/70">Try "Near me" or "Mandsaur"</span>
                        </div>
                    </div>
                    <div
                        className="shrink-0 px-6 py-2.5 bg-neutral-900 group-hover/btn:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors ml-2"
                    >
                        Search
                    </div>
                </div>
            </button>
        </div>
    );
}
