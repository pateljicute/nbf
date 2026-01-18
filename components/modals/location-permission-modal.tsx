'use client';

import { useEffect, useState } from 'react';
import { useLocation } from '@/lib/location-context';
import { MapPin, Navigation } from 'lucide-react';

export function LocationPermissionModal() {
    const { userLocation, permissionStatus, requestLocation } = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [hasAsked, setHasAsked] = useState(false);

    useEffect(() => {
        // Only show if:
        // 1. No user location stored
        // 2. Permission is not explicitly denied (so we can ask) or is prompt/unknown
        // 3. Haven't asked in this session yet (simple local state for now, could be session storage)
        // 4. Client-side only

        const asked = sessionStorage.getItem('nbf_location_prompted');

        if (!userLocation && !asked && permissionStatus !== 'denied') {
            // Delay slightly for smooth entry
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [userLocation, permissionStatus]);

    const handleAllow = async () => {
        sessionStorage.setItem('nbf_location_prompted', 'true');
        setHasAsked(true);
        try {
            await requestLocation();
            setIsOpen(false);
        } catch (e) {
            // Error handled in context
            // Keep modal open? No, close it, don't spam.
            setIsOpen(false);
        }
    };

    const handleDeny = () => {
        sessionStorage.setItem('nbf_location_prompted', 'true');
        setHasAsked(true);
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center pointer-events-none p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity animate-in fade-in" onClick={handleDeny} />

            <div className="bg-white pointer-events-auto w-full max-w-sm rounded-2xl shadow-2xl p-6 relative animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
                        <Navigation className="w-6 h-6 text-blue-600 fill-blue-600" />
                    </div>

                    <h3 className="text-xl font-bold text-neutral-900 mb-2">Enable Location? / लोकेशन चालू करें?</h3>
                    <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
                        We need your location to show you the best properties near you. <br />
                        आपके पास की सबसे अच्छी प्रॉपर्टीज दिखाने के लिए हमें आपकी लोकेशन चाहिए।
                    </p>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={handleDeny}
                            className="flex-1 py-3 px-4 rounded-xl text-neutral-500 font-medium hover:bg-neutral-50 transition-colors"
                        >
                            Not Now
                        </button>
                        <button
                            onClick={handleAllow}
                            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Navigation className="w-4 h-4 fill-white/20" />
                            Allow Access
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
