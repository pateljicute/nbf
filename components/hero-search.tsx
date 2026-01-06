'use client';

import { Search, MapPin } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { getLocationSuggestions, LocationSuggestion } from '@/lib/api';
import { useDebounce } from 'use-debounce';
import { INDIAN_CITIES, POPULAR_CITIES, City } from '@/constants/cities';

interface HeroSearchProps {
    onSearch?: (query: string) => void;
}

export function HeroSearch({ onSearch }: HeroSearchProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('location') || searchParams.get('q') || searchParams.get('search') || '');
    const [selectedCity, setSelectedCity] = useState<City | null>(null);
    const [showCityDropdown, setShowCityDropdown] = useState(false);

    const [debouncedQuery] = useDebounce(query, 300);
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const cityWrapperRef = useRef<HTMLDivElement>(null);

    // Initialize City from URL or default
    useEffect(() => {
        // If query matches a city, set it as selected
        const match = INDIAN_CITIES.find(c => c.name.toLowerCase() === query.toLowerCase());
        if (match) setSelectedCity(match);
    }, []);

    // Call onSearch when debounced query changes (for instant filtering)
    // Call onSearch when debounced query changes (for instant filtering)
    useEffect(() => {
        if (onSearch) {
            onSearch(debouncedQuery);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedQuery]);

    // Fetch suggestions when debounced query changes
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (debouncedQuery.length >= 2) {
                // Mix in city suggestions if query matches start of a city name
                const cityMatches = INDIAN_CITIES.filter(c => c.name.toLowerCase().startsWith(debouncedQuery.toLowerCase()))
                    .map(c => ({ label: c.name, type: 'City' as const }));

                const apiResults = await getLocationSuggestions(debouncedQuery);

                // Prioritize city matches
                setSuggestions([...cityMatches, ...apiResults]);
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        };
        fetchSuggestions();
    }, [debouncedQuery]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
            if (cityWrapperRef.current && !cityWrapperRef.current.contains(event.target as Node)) {
                setShowCityDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = (searchQuery: string) => {
        setShowSuggestions(false);
        const finalQuery = searchQuery.trim();

        // If onSearch is provided, we don't redirect (Instant Filter Mode)
        if (onSearch) {
            onSearch(finalQuery);
            return;
        }

        if (finalQuery) {
            // Check if it's a known city
            const cityMatch = INDIAN_CITIES.find(c => c.name.toLowerCase() === finalQuery.toLowerCase());
            if (cityMatch) setSelectedCity(cityMatch);

            router.push(`/properties?search=${encodeURIComponent(finalQuery)}`);
        } else {
            router.push('/properties');
        }
    };



    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                const selected = suggestions[selectedIndex].label;
                setQuery(selected);
                handleSearch(selected);
            } else {
                handleSearch(query);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    return (
        <div ref={wrapperRef} className="mt-4 w-full md:w-full max-w-2xl relative z-50 mx-auto">
            <div className="relative group/btn w-full">
                <div className="flex flex-row items-center justify-between w-full p-1.5 md:p-2 bg-white rounded-xl hover:bg-white/95 transition-all shadow-md border border-neutral-200 focus-within:border-neutral-300">
                    <div className="flex-1 flex items-center pl-3">
                        <Search className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setShowSuggestions(true);
                                setSelectedIndex(-1);
                            }}
                            onKeyDown={handleKeyDown}
                            onFocus={() => {
                                if (query.length >= 2) setShowSuggestions(true);
                            }}
                            placeholder="Search by city..."
                            className="w-full bg-transparent border-none focus:outline-none text-neutral-800 placeholder:text-neutral-400 font-medium text-sm md:text-base placeholder:text-xs md:placeholder:text-sm min-w-0"
                            autoComplete="off"
                        />
                    </div>
                    <button
                        onClick={() => handleSearch(query)}
                        className="shrink-0 px-4 py-2 md:px-6 md:py-2.5 bg-neutral-900 text-white text-sm font-bold rounded-lg transition-transform active:scale-95 md:hover:scale-105 cursor-pointer ml-2"
                    >
                        Search
                    </button>
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-[110%] left-0 right-0 bg-white rounded-xl shadow-xl overflow-hidden border border-neutral-100 divide-y divide-neutral-100 animate-in fade-in zoom-in-95 z-50">
                        {suggestions.map((item, index) => (
                            <div
                                key={`${item.label}-${index}`}
                                onClick={() => {
                                    setQuery(item.label);
                                    handleSearch(item.label);
                                }}
                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${index === selectedIndex ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                                    }`}
                            >
                                <div className="p-1.5 bg-neutral-100 rounded-full">
                                    <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-neutral-800">
                                        {item.label}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">{item.type}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
