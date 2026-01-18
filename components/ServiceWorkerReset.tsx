'use client';

import { useEffect } from 'react';

export function ServiceWorkerReset() {
    useEffect(() => {
        if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                for (const registration of registrations) {
                    console.log('[Dev] Unregistering Service Worker:', registration);
                    registration.unregister();
                }
            });
        }
    }, []);

    return null;
}
