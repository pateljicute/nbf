'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PWALifecycle() {
    const router = useRouter();

    useEffect(() => {
        // Check if running in standalone mode (PWA)
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone ||
            document.referrer.includes('android-app://');

        if (isStandalone) {
            // Check if we have already refreshed this session
            const hasRefreshed = sessionStorage.getItem('pwa_refreshed');

            if (!hasRefreshed) {
                console.log('🚀 PWA Detected: Triggering one-time auto-refresh for freshness...');

                // Mark as refreshed so we don't loop
                sessionStorage.setItem('pwa_refreshed', 'true');

                // Force a hard reload to ensure latest JS/CSS and cache clearing
                window.location.reload();
            }
        }
    }, []);

    return null;
}
