'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface LocationContextType {
    userLocation: { lat: number; lng: number } | null;
    permissionStatus: PermissionState | 'unknown';
    requestLocation: () => Promise<void>;
    setUserLocation: (location: { lat: number; lng: number } | null) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<PermissionState | 'unknown'>('unknown');

    // Load from session storage on mount
    useEffect(() => {
        const stored = sessionStorage.getItem('nbf_user_location');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.lat && parsed.lng) {
                    setUserLocation(parsed);
                }
            } catch (e) {
                console.error("Failed to parse stored location", e);
            }
        }

        // check permission status
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                setPermissionStatus(result.state);
                result.onchange = () => setPermissionStatus(result.state);
            });
        }
    }, []);

    const requestLocation = async () => {
        return new Promise<void>((resolve, reject) => {
            if (!navigator.geolocation) {
                toast.error("Geolocation is not supported by your browser");
                reject("Not supported");
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setUserLocation(loc);
                    sessionStorage.setItem('nbf_user_location', JSON.stringify(loc));
                    toast.success("Location updated successfully");
                    resolve();
                },
                (error) => {
                    // Log specific properties as the error object itself typically logs as {}
                    console.error("Location Error Details:", {
                        code: error.code,
                        message: error.message
                    });

                    let msg = "Could not fetch location. Please try again.";

                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            msg = "Location permission denied. Please enable it in browser settings.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            msg = "Location information is unavailable.";
                            break;
                        case error.TIMEOUT:
                            msg = "Location request timed out.";
                            break;
                        default:
                            msg = error.message || "An unknown error occurred.";
                    }

                    toast.error(msg);
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    };

    return (
        <LocationContext.Provider value={{ userLocation, permissionStatus, requestLocation, setUserLocation }}>
            {children}
        </LocationContext.Provider>
    );
}

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
};
