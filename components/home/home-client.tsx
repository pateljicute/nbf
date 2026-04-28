'use client';

import { useState, useCallback, useEffect } from 'react';
import { Hero } from '@/components/hero';
import { Product, AdSettings } from '@/lib/types';
import { LatestProductCard } from '@/components/products/latest-product-card';
import { SmartAdsSlider } from '@/components/home/SmartAdsSlider';
import Link from 'next/link';
import { AutoScroll } from '@/components/ui/auto-scroll';
import { MessageCircle, MapPin, Navigation, Loader2 } from 'lucide-react';
import { getLabelPosition } from '@/lib/utils';
import { INDIAN_CITIES } from '@/constants/cities';
import { useAuth } from '@/lib/auth-context';
import { BannedView } from '@/components/common/banned-view';
import { useLocationDiscovery } from '@/hooks/use-location-discovery';
import { getProducts } from '@/lib/api';
import { useListingMode } from '@/lib/listing-mode-context';
import AuthModal from '@/components/auth/auth-modal';


interface HomeClientProps {
    initialProducts: Product[];
    ads?: any[];
}

const DISCOVERY_CACHE_KEY = 'nbf_discovery_cache_v1';
const DISCOVERY_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function HomeClient({ initialProducts, ads = [] }: HomeClientProps) {
    const { user, profile, isLoading } = useAuth();
    const { mode } = useListingMode();
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    
    // --- HYDRATION-SAFE INITIALIZATION ---
    // We MUST initialize with server-safe defaults (initialProducts) 
    // to prevent "patelji vs sushil" hydration errors.
    const [filteredProducts, setFilteredProducts] = useState(initialProducts);
    const [nearbyLocationName, setNearbyLocationName] = useState<string | null>(null);
    const [lastFetchCoords, setLastFetchCoords] = useState<{lat: number, lon: number} | null>(null);
    const [isSearchingNearby, setIsSearchingNearby] = useState(false);
    const [isError, setIsError] = useState(false);
    const { location, loading: locationLoading, permissionState, updateLocation } = useLocationDiscovery();

    // Mode-switch detector to force fresh fetches
    const [lastFetchMode, setLastFetchMode] = useState(mode);
    useEffect(() => {
        if (mode !== lastFetchMode) {
            setLastFetchMode(mode);
            setLastFetchCoords(null); // Bypass distance throttle
            localStorage.removeItem(DISCOVERY_CACHE_KEY);
        }
    }, [mode, lastFetchMode]);

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        
        // 1. RE-HYDRATE DISCOVERY CACHE AFTER MOUNT
        // This ensures the first client render matches server (initialProducts),
        // and then we instantly switch to discovery results.
        try {
            const stored = localStorage.getItem(DISCOVERY_CACHE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Date.now() - parsed.timestamp < DISCOVERY_TTL_MS && parsed.mode === mode) {
                    setFilteredProducts(parsed.products);
                    setNearbyLocationName(parsed.locationName);
                    setLastFetchCoords(parsed.coords);
                    console.log(`Sticky Discovery: Restored ${parsed.locationName} from cache for mode: ${mode}`);
                } else {
                    // Cache is for a different mode or expired, ignore it
                    localStorage.removeItem(DISCOVERY_CACHE_KEY);
                }
            }
        } catch (e) {
            console.error("Discovery cache hydration error", e);
        }

        // Auto-popup for guest users: show login modal after 3s if not dismissed this session
        const dismissed = sessionStorage.getItem('nbf_welcome_dismissed');
        if (!dismissed) {
            const timer = setTimeout(() => {
                // Check user at popup time, not at mount time
                setShowWelcomeModal(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const router = require('next/navigation').useRouter();

    // 2. Real-time Supabase Data Sync (Instant Admin Approval Reflection)
    useEffect(() => {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        console.log('[Real-time] Initializing Supabase Realtime subscription...');

        const channel = supabase.channel('home_properties_realtime')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'properties' 
            }, (payload: any) => {
                console.log('[Real-time] UPDATE DETECTED:', payload.eventType, payload.new?.title);
                
                // 1. Force clear EVERYTHING from cache to ensure fresh start
                localStorage.removeItem(DISCOVERY_CACHE_KEY);
                sessionStorage.removeItem('nbf_discovery_coords'); // Extra safety
                
                // 2. Trigger Router Refresh (Updates Server Props / initialProducts)
                router.refresh();

                // 3. Re-trigger location discovery instantly
                // Resetting lastFetchCoords triggers the discovery useEffect
                setLastFetchCoords(null);
                
                console.log('[Real-time] UI Refresh triggered for new property.');
            })
            .subscribe((status: any) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[Real-time] Connected successfully.');
                }
                if (status === 'CHANNEL_ERROR') {
                    console.warn('[Real-time] Connection failed. Live updates disabled, but app will still work on refresh.');
                }
            });

        return () => {
            console.log('[Real-time] Cleaning up subscription...');
            supabase.removeChannel(channel);
        };
    }, [router, location]);

    // 3. Sync state with Server Props (Essential for router.refresh() to work)
    useEffect(() => {
        if (initialProducts) {
            setFilteredProducts(initialProducts.filter(p => (p.listing_type || 'rent') === mode));
        }
    }, [initialProducts, mode]);

    const handleLocationDiscovery = useCallback(async () => {
        if (!location?.lat || !location?.lon) return;

        const { calculateDistance } = require('@/lib/geocoding');
        
        // --- THROTTLING LOGIC ---
        if (lastFetchCoords) {
            const dist = calculateDistance(location.lat, location.lon, lastFetchCoords.lat, lastFetchCoords.lon);
            if (dist < 5) return; 
        }

        setIsSearchingNearby(true);
        setIsError(false);
        const locationDisplayName = location.area && location.area !== location.city 
            ? `${location.area}, ${location.city}` 
            : (location.city || "Nearby Areas");
        
        console.log(`Smart Discovery: Coords (${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}) -> ${locationDisplayName}`);

        try {
            let results = await getProducts({ 
                lat: location.lat, 
                lng: location.lon, 
                radius: 60000,
                listing_type: mode
            });

            if (results && results.length > 0) {
                const radiusLabel = locationDisplayName ? `Nearby ${locationDisplayName}` : `Nearby`;
                setFilteredProducts(results);
                setNearbyLocationName(radiusLabel);
                
                const freshCache = {
                    products: results,
                    locationName: radiusLabel,
                    coords: { lat: location.lat, lon: location.lon },
                    timestamp: Date.now(),
                    mode: mode
                };
                setLastFetchCoords(freshCache.coords);
                localStorage.setItem(DISCOVERY_CACHE_KEY, JSON.stringify(freshCache));
            } else {
                setFilteredProducts([]);
                setNearbyLocationName(`No properties available in your area (${location.city || 'Nearby'})`);
                localStorage.removeItem(DISCOVERY_CACHE_KEY);
            }
        } catch (error) {
            console.error('Smart Discovery Error:', error);
            setIsError(true);
        } finally {
            setIsSearchingNearby(false);
        }
    }, [location, lastFetchCoords, mode]);

    // 3. Smart Discovery Effect
    useEffect(() => {
        if (mounted) {
            handleLocationDiscovery();
        }
    }, [mounted, location, handleLocationDiscovery]);

    const handleSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setFilteredProducts(initialProducts.filter(p => (p.listing_type || 'rent') === mode));
            setNearbyLocationName(location?.city || null);
            return;
        }

        setIsSearchingNearby(true);
        const lowerQuery = query.toLowerCase().trim();

        // 1. CLIENT-SIDE Filter (Instant) — mode-strict, check all relevant fields
        const filtered = initialProducts.filter(product => {
            const modeMatch = (product.listing_type || 'rent') === mode;
            if (!modeMatch) return false;

            const titleMatch = product.title?.toLowerCase().includes(lowerQuery);
            const cityMatch = product.city?.toLowerCase().includes(lowerQuery);
            const localityMatch = product.locality?.toLowerCase().includes(lowerQuery);
            const addressMatch = product.address?.toLowerCase().includes(lowerQuery);
            const tagMatch = product.tags?.some((tag: string) => tag.toLowerCase().includes(lowerQuery));
            const descMatch = product.description?.toLowerCase().includes(lowerQuery);

            return titleMatch || cityMatch || localityMatch || addressMatch || tagMatch || descMatch;
        });

        if (filtered.length > 0) {
            setFilteredProducts(filtered);
            setNearbyLocationName(query);
            setIsSearchingNearby(false);
            return;
        }

        // 2. SERVER-SIDE Query (Fallback) — always with mode filter
        try {
            console.log(`No client-side matches for "${query}". Checking server with mode=${mode}...`);
            const serverResults = await getProducts({ query: lowerQuery, listing_type: mode });
            
            if (serverResults && serverResults.length > 0) {
                // Extra safety: enforce mode on server results too
                const modeFiltered = serverResults.filter((p: any) => (p.listing_type || 'rent') === mode);
                setFilteredProducts(modeFiltered);
                setNearbyLocationName(query);
            } else {
                // NO RESULTS — show empty state, NOT all properties
                setFilteredProducts([]);
                setNearbyLocationName(`"${query}" – No ${mode === 'sell' ? 'properties for sale' : 'rental properties'} found`);
            }
        } catch (error) {
            console.error('Search fallback error:', error);
            setFilteredProducts([]);
            setNearbyLocationName(null);
        } finally {
            setIsSearchingNearby(false);
        }
    }, [initialProducts, location, mode]);

    // Removed blocking isLoading check so that SSR HTML paints immediately!
    // Banned check will still gracefully take over once auth resolves in the background.

    if (profile?.status === 'banned') {
        return <BannedView />;
    }

    return (
        <div className="flex flex-col gap-10 md:gap-24 pb-20 md:pb-0 overflow-y-auto overflow-x-hidden w-full">
            {/* Welcome Login Popup - shows after 3s for new/guest users */}
            {!user && (
                <AuthModal
                    isOpen={showWelcomeModal}
                    onClose={() => {
                        setShowWelcomeModal(false);
                        sessionStorage.setItem('nbf_welcome_dismissed', '1');
                    }}
                />
            )}

            {/* Hero Section */}
            <div className="relative top-0 z-40 bg-white/80 backdrop-blur-md md:sticky md:top-auto md:bg-transparent md:backdrop-blur-none transition-all">
                {/* Pass handleSearch to Hero -> HeroSearch */}
                <Hero onSearch={handleSearch} />
            </div>

            <AutoScroll />

            {/* Product Grid Section */}
            <section
                suppressHydrationWarning
                className="w-full max-w-[1920px] mx-auto px-6 md:px-12 relative z-20 mt-24 md:mt-28 bg-white rounded-t-3xl pt-8"
            >
                <div
                    suppressHydrationWarning
                    className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 md:mb-12"
                >
                    <div className="mt-12 md:mt-0" suppressHydrationWarning>
                        {/* SEO H1 */}
                        <h1 className="sr-only">Best PGs and Rooms in {!mounted ? 'Mandsaur' : (location?.city || 'Mandsaur')}</h1>

                        {/* Suppress hydration warning for responsive classes */}
                        <div className="flex flex-col gap-1" suppressHydrationWarning>
                            <h3
                                suppressHydrationWarning
                                className="text-2xl md:text-4xl font-serif font-bold text-neutral-900 flex items-center gap-3"
                            >
                                {!mounted ? 'Featured Properties' : (
                                    locationLoading ? 'Locking GPS Satellite...' :
                                    isSearchingNearby ? 'Finding nearby...' : 
                                    nearbyLocationName ? `Properties in ${nearbyLocationName}` : 
                                    'Featured Properties'
                                )}
                                {mounted && nearbyLocationName && !isSearchingNearby && !locationLoading && (
                                    <div className="flex items-center gap-2" suppressHydrationWarning>
                                        <MapPin className="w-5 h-5 md:w-8 md:h-8 text-amber-500 animate-bounce" />
                                        <button 
                                            onClick={() => {
                                                localStorage.removeItem(DISCOVERY_CACHE_KEY);
                                                setLastFetchCoords(null);
                                                updateLocation();
                                            }}
                                            className="text-[10px] h-6 px-2 rounded-full border border-neutral-200 hover:bg-neutral-50 transition-colors uppercase tracking-widest font-sans font-bold text-neutral-400"
                                        >
                                            Refresh
                                        </button>
                                    </div>
                                )}
                                {mounted && (isSearchingNearby || locationLoading) && (
                                    <Loader2 className="w-5 h-5 md:w-8 md:h-8 text-neutral-400 animate-spin" />
                                )}
                            </h3>
                            <div className="flex items-center gap-2 pt-2" suppressHydrationWarning>
                                <p className="text-gray-600" suppressHydrationWarning>
                                    {!mounted ? 'Handpicked PGs and flats for you.' : (
                                        locationLoading ? 'Wait a moment while we find your exact area...' :
                                        nearbyLocationName 
                                            ? `Showing the best properties in and around ${nearbyLocationName}` 
                                            : 'Handpicked PGs and flats for you.')
                                    }
                                </p>
                                {mounted && permissionState === 'prompt' && !location && (
                                    <button 
                                        onClick={() => {
                                            localStorage.removeItem(DISCOVERY_CACHE_KEY);
                                            // setCachedData is not available anymore, it was a derived state but we handle it elsewhere
                                            updateLocation();
                                        }}
                                        className="text-xs font-bold text-amber-600 hover:text-amber-700 underline flex items-center gap-1"
                                    >
                                        <Navigation className="w-3 h-3" /> Detect Location
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Premium View All Button */}
                    <Link
                        href="/properties"
                        className="hidden md:inline-flex bg-black text-white px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-lg"
                    >
                        View All Properties
                    </Link>
                </div>

                <div suppressHydrationWarning className="w-full">
                    {isError ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-red-50/50 rounded-3xl border border-red-100/50" suppressHydrationWarning>
                             <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-3xl mb-4">
                                📶
                            </div>
                            <h3 className="text-xl font-bold text-neutral-900 mb-2">Connection Problem</h3>
                            <p className="text-neutral-500 mb-6 text-center max-w-xs">We're having trouble reaching our servers. Please check your data or WiFi.</p>
                            <button
                                onClick={() => handleLocationDiscovery()}
                                className="bg-black text-white px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-lg flex items-center gap-2"
                            >
                                <Navigation className="w-4 h-4" /> Try Again
                            </button>
                        </div>
                    ) : filteredProducts.length > 0 ? (
                        <div className="flex flex-col gap-y-10 p-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-x-8 md:gap-y-12" suppressHydrationWarning>
                            {filteredProducts.map((product: any, index: number) => (
                                <LatestProductCard
                                    key={product.id}
                                    product={product}
                                    labelPosition={getLabelPosition(index)}
                                    className="w-full"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[30vh] gap-4" suppressHydrationWarning>
                        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center text-3xl">
                            🔍
                        </div>
                        <p className="text-xl font-medium text-neutral-900">No properties found</p>
                        <p className="text-neutral-500">Try searching for a different city or area.</p>
                        <button
                            onClick={() => {
                                // Reset filters but STAY in current mode
                                setFilteredProducts(initialProducts.filter(p => (p.listing_type || 'rent') === mode));
                                setNearbyLocationName(null);
                            }}
                            className="text-black font-bold border-b border-black pb-0.5 hover:opacity-70"
                        >
                            View all properties
                        </button>
                    </div>
                )}
                </div>

                <div className="mt-12 text-center md:hidden">
                    <Link
                        href="/properties"
                        className="inline-flex bg-black text-white px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-lg"
                    >
                        View All Properties
                    </Link>
                </div>
            </section>

            {/* Smart Ads Slider OR Social Proof (Conditional) */}
            {ads.length > 0 ? (
                <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <SmartAdsSlider ads={ads} />
                </div>
            ) : (
                <div className="w-full border-y border-neutral-100 bg-neutral-50/30 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="max-w-[1920px] mx-auto px-6 md:px-12 py-10">
                        <p className="text-center text-sm font-medium text-neutral-400 uppercase tracking-widest mb-8">Trusted by Students & Professionals</p>
                        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                            <span className="text-xl font-bold font-serif text-neutral-800">STUDENTS</span>
                            <span className="text-xl font-bold font-serif text-neutral-800">BACHELORS</span>
                            <span className="text-xl font-bold font-serif text-neutral-800">FAMILIES</span>
                            <span className="text-xl font-bold font-serif text-neutral-800">CORPORATES</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Newsletter / Enterprise CTA */}
            <section className="w-full bg-neutral-900 text-white overflow-hidden rounded-none md:rounded-3xl mx-auto max-w-[1920px]">
                <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[400px]">
                    <div className="p-12 md:p-24 flex flex-col justify-center gap-8">
                        <h2 className="text-4xl md:text-5xl font-serif font-medium">Get Instant WhatsApp Alerts</h2>
                        <p className="text-neutral-400 text-lg max-w-md">
                            Join our WhatsApp community to get notified about new PGs and flats in Mandsaur before anyone else!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 max-w-md">
                            <Link
                                href="https://whatsapp.com/channel/0029Vb7ZqswLtOjF8AQiBL19"
                                target="_blank"
                                className="flex-1 bg-[#25D366] text-white px-8 py-4 rounded-full font-bold uppercase tracking-wide hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-3"
                            >
                                <MessageCircle className="w-6 h-6 fill-current" />
                                Join WhatsApp Channel
                            </Link>
                        </div>
                        <p className="text-xs text-neutral-600">
                            Join 500+ members receiving daily updates.
                        </p>
                    </div>
                    <div className="relative bg-neutral-800 hidden lg:block">
                        {/* Abstract Pattern or Image would go here */}
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-neutral-900 to-neutral-900" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="font-serif text-9xl opacity-5 font-black tracking-tighter">NBF</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
