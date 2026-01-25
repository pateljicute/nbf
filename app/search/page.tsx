'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocation } from '@/lib/location-context';
import { Search, MapPin, Navigation, ArrowLeft, Loader2, Home, Building2, Map as MapIcon, Mic } from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from 'use-debounce';
import { getLocationSuggestions, LocationSuggestion } from '@/lib/api';

interface AreaSuggestion {
    name: string;
    city: string;
    distance?: number;
    count?: number;
    type?: 'CITY' | 'LOCALITY' | 'PROJECT' | 'LANDMARK';
}

export default function SearchPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { userLocation, requestLocation } = useLocation();

    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [debouncedQuery] = useDebounce(query, 300);

    // Results
    const [suggestions, setSuggestions] = useState<AreaSuggestion[]>([]);
    const [nearbyAreas, setNearbyAreas] = useState<AreaSuggestion[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus on mount
    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    // 1. Fetch Nearby Areas (Default View)
    useEffect(() => {
        if (userLocation && !query) {
            fetchNearbyAreas(userLocation.lat, userLocation.lng);
        }
    }, [userLocation, query]);

    // 2. Predictive Search (Typing View)
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (debouncedQuery.length < 2) {
                if (!userLocation) setSuggestions([]);
                return;
            }

            setIsLoading(true);
            try {
                // Fetch from existing API helper (client-side)
                // We map the simple string results to our rich structure
                const rawSuggestions = await getLocationSuggestions(debouncedQuery);

                // Enhance suggestions with Types
                const enhancedSuggestions: AreaSuggestion[] = rawSuggestions.map(s => ({
                    name: s.label,
                    city: 'Mandsaur', // In production, we'd get this from the API response
                    type: s.type === 'City' ? 'CITY' : 'LOCALITY'
                }));

                // Add "Search for 'query'" fallback
                if (enhancedSuggestions.length === 0) {
                    enhancedSuggestions.push({ name: debouncedQuery, city: 'Search Query', type: 'PROJECT' });
                }

                setSuggestions(enhancedSuggestions);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSuggestions();
    }, [debouncedQuery]);

    const fetchNearbyAreas = async (lat: number, lng: number) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/products?lat=${lat}&lng=${lng}&radius=20&mode=areas`);
            let data = await res.json();

            // Format API response (if array of simple objects) to AreaSuggestion
            if (Array.isArray(data)) {
                setNearbyAreas(data.map((item: any) => ({
                    name: item.name,
                    city: item.city,
                    distance: item.distance,
                    count: item.count,
                    type: 'LOCALITY'
                })));
            } else {
                // Fallback Mock if API not fully ready with 'mode=areas'
                const mockAreas = [
                    { name: "Station Road", city: "Mandsaur", distance: 2.5, count: 15, type: 'LOCALITY' },
                    { name: "BPL Chouraha", city: "Mandsaur", distance: 3.1, count: 8, type: 'LOCALITY' },
                    { name: "Sanjeet Marg", city: "Mandsaur", distance: 4.0, count: 12, type: 'LOCALITY' },
                    { name: "Gomti Nagar", city: "Dewas", distance: 1.5, count: 5, type: 'LOCALITY' },
                ];
                setNearbyAreas(mockAreas as any);
            }

        } catch (error) {
            console.error("Failed to fetch nearby areas", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLocateMe = async () => {
        setIsLocating(true);
        try {
            await requestLocation();
        } catch (e) {
            // handled
        } finally {
            setIsLocating(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        router.push(`/properties?query=${encodeURIComponent(query)}`);
    };

    const handleAreaClick = (area: AreaSuggestion) => {
        const searchQuery = area.city ? `${area.name}, ${area.city}` : area.name;
        router.push(`/properties?query=${encodeURIComponent(searchQuery)}`);
    };

    // Helper to get Icon based on Type
    const getTypeIcon = (type?: string) => {
        switch (type) {
            case 'CITY': return <MapIcon className="w-5 h-5 text-neutral-400" />;
            case 'PROJECT': return <Building2 className="w-5 h-5 text-neutral-400" />;
            case 'LANDMARK': return <MapPin className="w-5 h-5 text-neutral-400" />;
            case 'LOCALITY': default: return <MapPin className="w-5 h-5 text-neutral-400" />;
        }
    };

    const activeList = query ? suggestions : nearbyAreas;
    const listTitle = query ? 'Direct Matches' : (userLocation ? 'Popular Areas Near You' : 'Most Searched Areas');

    return (
        <div className="min-h-screen bg-white flex flex-col animate-in fade-in duration-300">
            {/* Header / Search Top Bar */}
            <div className="p-4 border-b sticky top-0 bg-white z-10 safe-top shadow-sm">

                {/* Top Row: Searching in... */}
                <div className="flex justify-between items-center mb-4 px-1">
                    <h1 className="text-sm font-semibold text-neutral-800 flex items-center gap-1">
                        Searching in <span className="text-black font-bold">Mandsaur</span>
                    </h1>
                    <button className="text-xs font-medium text-blue-600 hover:bg-blue-50 px-2 py-1 rounded">
                        Change City
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-neutral-500 hover:bg-neutral-50 rounded-full">
                        <ArrowLeft className="w-6 h-6" />
                    </button>

                    <form onSubmit={handleSearch} className="flex-1 relative group">
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by City"
                            className="w-full bg-neutral-100 text-lg font-medium px-4 py-3 pl-11 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                        <Search className="w-5 h-5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500" />

                        {query && (
                            <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-200 rounded-full">
                                <span className="text-xs font-bold text-neutral-500">✕</span>
                            </button>
                        )}
                        {!query && (
                            <Mic className="w-5 h-5 text-blue-500 absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform" />
                        )}
                    </form>
                </div>

                {/* Find Properties Near Me Button Removed as per request */}
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto">
                {/* Suggestions List */}
                <div className="">
                    {isLoading ? (
                        <div className="space-y-0 p-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-4 py-4 border-b border-neutral-50 animate-pulse">
                                    <div className="w-10 h-10 bg-neutral-100 rounded-lg" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-neutral-100 w-3/4 rounded" />
                                        <div className="h-3 bg-neutral-100 w-1/2 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : activeList.length > 0 ? (
                        <div className="bg-white">
                            {/* Section Header if needed */}
                            {/* <div className="px-5 py-3 bg-neutral-50 border-y border-neutral-100 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                                {listTitle}
                            </div> */}

                            <div className="divide-y divide-neutral-100">
                                {activeList.map((area, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleAreaClick(area)}
                                        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 transition-colors text-left group"
                                    >
                                        <div className="w-10 h-10 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors shrink-0">
                                            {getTypeIcon(area.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className="font-medium text-base text-neutral-900 truncate pr-2 group-hover:text-blue-700">{area.name}</p>
                                            </div>
                                            <p className="text-xs text-neutral-400 font-bold mt-0.5 tracking-wider uppercase">
                                                {area.type || 'LOCALITY'}
                                                <span className="font-normal normal-case text-neutral-400 ml-1">• {area.city}</span>
                                            </p>
                                        </div>
                                        <div className="shrink-0 -rotate-45 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ArrowLeft className="w-4 h-4 text-neutral-300" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // Empty State
                        !isLoading && query && (
                            <div className="text-center py-20 text-neutral-400">
                                <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>No results found for "{query}"</p>
                            </div>
                        )
                    )}

                    {/* Default Categories if empty - e.g. "Recent Searches" or default list */}
                    {!query && !userLocation && activeList.length === 0 && (
                        <div className="p-8 text-center opacity-50">
                            <Home className="w-12 h-12 mx-auto mb-3" />
                            <p>Search by City, Locality or Project</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
