'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2, Navigation, AlertTriangle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from '@/lib/location-context';

// Fix for Leaflet Default Icon
const DefaultIcon = L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// 1. Fixed City Anchors (Main Squares/Bus Stands/Temples)
const CITY_ANCHORS: Record<string, [number, number]> = {
    'mandsaur': [24.0668, 75.0654], // Pashupatinath Temple / City Center
    'ratlam': [23.3342, 75.0371],     // Ratlam City Center
    'neemuch': [24.4777, 74.8741],    // Neemuch City Center
    'ujjain': [23.1793, 75.7849],     // Ujjain Mahakal Area
    'kota': [25.1825, 75.8391],       // Kota City Center
};

interface LocationPickerProps {
    initialLat?: number;
    initialLng?: number;
    initialQuery?: string;
    selectedCity?: string;
    selectedState?: string; // Added State for Cascading Search
    onLocationSelect: (data: {
        lat: number;
        lng: number;
        address?: string;
        city?: string;
        state?: string;
        locality?: string;
    }) => void;
    onClose: () => void;
}

// Component to handle map center updates
function MapController({ center, zoom }: { center: [number, number], zoom?: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom || map.getZoom());
    }, [center, zoom, map]);
    return null;
}

// Component to track map movement
function MapEvents({ onMoveEnd }: { onMoveEnd: (lat: number, lng: number) => void }) {
    const map = useMap();
    useMapEvents({
        moveend: () => {
            const center = map.getCenter();
            onMoveEnd(center.lat, center.lng);
        },
    });
    return null;
}

export default function LocationPicker({
    initialLat = 24.07, // Default Mandsaur coordinates
    initialLng = 75.07,
    initialQuery,
    selectedCity,
    selectedState,
    onLocationSelect,
    onClose
}: LocationPickerProps) {
    const { userLocation: globalUserLocation, requestLocation } = useLocation(); // Use global context
    const [center, setCenter] = useState<[number, number]>([initialLat, initialLng]);
    const [zoomLevel, setZoomLevel] = useState<number>(18);
    // const [userLocation, setUserLocation] = useState<[number, number] | null>(null); // Removed local state logic, rely on global or map events
    const [mapUserLocation, setMapUserLocation] = useState<[number, number] | null>(null); // Visual blue dot only

    const [address, setAddress] = useState<string>('Move map to refined location');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedData, setSelectedData] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState(initialQuery || '');
    const [isSearching, setIsSearching] = useState(false);

    // Debounce Ref for API calls
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sync global location to map dot if available
    useEffect(() => {
        if (globalUserLocation) {
            setMapUserLocation([globalUserLocation.lat, globalUserLocation.lng]);
        }
    }, [globalUserLocation]);

    // Initial Load Logic
    useEffect(() => {
        const initMap = async () => {
            // Priority 0: Check Fixed City Anchors First
            const cityKey = selectedCity?.toLowerCase().trim();
            if (cityKey && CITY_ANCHORS[cityKey]) {
                setCenter(CITY_ANCHORS[cityKey]);
                setZoomLevel(16);
                toast.success(`Jumped to ${selectedCity} City Center`);
                triggerVerificationPrompt();
                return;
            }

            // Fallback: Mandsaur specific check
            if (initialQuery && initialQuery.toLowerCase().includes('mandsaur')) {
                setCenter(CITY_ANCHORS['mandsaur']);
                setZoomLevel(16);
                toast.success("Jumped to Mandsaur City Center");
                triggerVerificationPrompt();
                return;
            }

            // Priority 0.5: Global User Location (Auto-Jump) if no strict City/Query
            // If user has allowed location, jump there instead of Mandsaur defaults
            if (!selectedCity && !initialQuery && globalUserLocation) {
                setCenter([globalUserLocation.lat, globalUserLocation.lng]);
                setZoomLevel(18);
                toast.success("Jumped to your current location");
                return;
            }

            // Priority 1: Generic Search
            if (initialQuery) {
                try {
                    setIsSearching(true);
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(initialQuery)}`);
                    const data = await response.json();
                    if (data && data.length > 0) {
                        const { lat, lon } = data[0];
                        setCenter([parseFloat(lat), parseFloat(lon)]);
                        setZoomLevel(14);
                        return;
                    }
                } catch (e) {
                    console.error("Initial query failed", e);
                } finally {
                    setIsSearching(false);
                }
            }
        };
        initMap();
    }, [initialQuery, selectedCity, globalUserLocation]);

    const triggerVerificationPrompt = () => {
        setTimeout(() => {
            toast(
                <div className="flex flex-col gap-1">
                    <span className="font-bold">Are we in the right area?</span>
                    <span className="text-xs">If not, type your colony name in the search bar.</span>
                </div>,
                { duration: 5000, icon: <AlertTriangle className="w-4 h-4 text-yellow-500" /> }
            );
        }, 1000);
    };

    // Handle "Locate Me" using Global Context
    const handleLocateMe = async () => {
        setIsLoading(true);
        try {
            await requestLocation();
            // requestLocation updates global state, which triggers useEffect sync for dot
            // We force center update here for immediate feedback if already permitted
            // Re-fetch form context or simple navigator just to be sure we get latest
            navigator.geolocation.getCurrentPosition((pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setCenter([lat, lng]);
                setZoomLevel(18);
                toast.success("Moved to your exact location");
                setIsLoading(false);
            });
        } catch (e) {
            console.warn("Locate Me failed", e);
            setIsLoading(false);
        }
    };

    // 2. Cascading Search Logic
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);

        let finalQuery = searchQuery;
        const cityContext = selectedCity ? `, ${selectedCity}` : '';
        const stateContext = selectedState ? `, ${selectedState}` : '';

        if (selectedCity && !searchQuery.toLowerCase().includes(selectedCity.toLowerCase())) {
            finalQuery += cityContext;
        }
        if (selectedState && !finalQuery.toLowerCase().includes(selectedState.toLowerCase())) {
            finalQuery += stateContext;
        }

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(finalQuery)}`);
            const data = await response.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                setCenter([parseFloat(lat), parseFloat(lon)]);
                setZoomLevel(17);
                toast.success(`Found: ${data[0].display_name.split(',')[0]}`);
            } else {
                toast.error(`Location not found in ${selectedCity || 'this area'}`);
            }
        } catch (error) {
            console.error("Search error", error);
            toast.error("Search failed");
        } finally {
            setIsSearching(false);
        }
    };

    const handleMoveEnd = useCallback((lat: number, lng: number) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        setIsLoading(true);
        setAddress("Fetching details...");

        timeoutRef.current = setTimeout(async () => {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`);
                const data = await response.json();

                if (data && data.display_name) {
                    const formattedAddress = data.display_name;
                    const addr = data.address;

                    const city = addr?.city || addr?.town || addr?.village || '';
                    const state = addr?.state || '';
                    const locality = addr?.suburb || addr?.neighbourhood || '';

                    setAddress(formattedAddress);
                    setSelectedData({
                        lat,
                        lng,
                        address: formattedAddress,
                        city,
                        state,
                        locality
                    });
                } else {
                    setAddress("Location details not found");
                }
            } catch (error) {
                console.error("Geocoding error:", error);
                setAddress("Error fetching address");
            } finally {
                setIsLoading(false);
            }
        }, 1000);
    }, []);

    const handleConfirm = () => {
        if (selectedData && selectedCity && selectedData.city) {
            const pinCity = selectedData.city.toLowerCase().trim();
            const formCity = selectedCity.toLowerCase().trim();

            if (!pinCity.includes(formCity) && !formCity.includes(pinCity)) {
                const confirmMismatch = window.confirm(
                    `⚠️ City Mismatch Alert / शहर मेल नहीं खा रहा\n\n` +
                    `You selected "${selectedCity}" but pinned a location in "${selectedData.city}".\n` +
                    `आपने "${selectedCity}" चुना था, लेकिन पिन "${selectedData.city}" में है।\n\n` +
                    `Are you sure? / क्या आप सुनिश्चित हैं?`
                );
                if (!confirmMismatch) return;
            }
        }

        if (selectedData) {
            onLocationSelect(selectedData);
            onClose();
        } else {
            onLocationSelect({ lat: center[0], lng: center[1] });
            onClose();
        }
    };

    return (
        <div className="flex flex-col h-[600px] w-full bg-white rounded-xl overflow-hidden relative">

            {/* Search Bar Overlay */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-md">
                <form onSubmit={handleSearch} className="relative shadow-2xl rounded-xl">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search your colony or landmark..."
                        className="w-full pl-5 pr-12 py-4 rounded-xl border-2 border-white/20 bg-white/95 backdrop-blur text-neutral-900 placeholder:text-neutral-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-base shadow-sm transition-all"
                    />
                    <button
                        type="submit"
                        disabled={isSearching}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    </button>
                </form>
            </div>

            {/* Locate Me Floating Button */}
            <button
                onClick={handleLocateMe}
                className="absolute bottom-40 right-4 z-[1000] p-3 bg-white text-blue-600 rounded-full shadow-xl hover:bg-blue-50 transition-all border border-neutral-200"
                title="Use Current Location"
            >
                <Navigation className="w-6 h-6 fill-current" />
            </button>


            <MapContainer
                center={center}
                zoom={18}
                className="w-full h-full z-0"
            >
                {/* Google Maps Hybrid */}
                <TileLayer
                    url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                    attribution='&copy; Google Maps'
                    maxZoom={20}
                    subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                />

                <MapController center={center} zoom={zoomLevel} />
                <MapEvents onMoveEnd={handleMoveEnd} />

                {/* Blue Dot */}
                {mapUserLocation && (
                    <Circle
                        center={mapUserLocation}
                        pathOptions={{ color: 'white', fillColor: '#3b82f6', fillOpacity: 1, weight: 2 }}
                        radius={20}
                    >
                        <Popup>Your Current Location</Popup>
                    </Circle>
                )}

            </MapContainer>

            {/* Fixed Center Pin */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[500] pointer-events-none pb-10">
                <div className="text-red-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    <MapPin size={48} fill="#ef4444" stroke="white" strokeWidth={1.5} className="animate-bounce" />
                    <div className="w-4 h-4 bg-black/50 rounded-full blur-[2px] mx-auto mt-[-10px]"></div>
                </div>
            </div>

            {/* Address Panel */}
            <div className="bg-white p-4 border-t z-[1000] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <div className="mb-3">
                    <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-1">Detected Location / पता :</p>
                    <div className="flex items-start gap-2 text-neutral-800">
                        <MapPin className="w-4 h-4 mt-0.5 text-blue-600 shrink-0" />
                        <p className="text-sm font-medium leading-snug">
                            {address}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 text-neutral-600 font-medium hover:bg-neutral-100 rounded-lg transition-colors border border-neutral-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading || !selectedData}
                        className="flex-1 px-4 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all shadow-md disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Please wait...
                            </>
                        ) : (
                            "Confirm Location"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
