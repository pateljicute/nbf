'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // 1. Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker registered with scope:', registration.scope);
                })
                .catch((error) => {
                    console.error('Service Worker registration failed:', error);
                });
        }

        // 2. Check conditions: Already Installed OR Not Mobile OR Dismissed
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const hasDismissed = sessionStorage.getItem('install_prompt_dismissed');

        if (isStandalone || !isMobile || hasDismissed) {
            return;
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Fallback for immediate testing if event doesn't fire (e.g. dev environment)
        // In prod, strictly wait for event. For now, we trust the event or manual trigger logic.

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        setDeferredPrompt(null);
        setIsVisible(false);
    };

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('install_prompt_dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-top duration-500">
            <div className="bg-white/90 backdrop-blur-md text-neutral-900 p-4 rounded-xl shadow-2xl flex items-center justify-between gap-4 border border-neutral-200 mx-auto max-w-md ring-1 ring-black/5">
                <div className="flex items-center gap-3">
                    <div className="bg-neutral-900 rounded-lg p-1 w-12 h-12 flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-lg">NBF</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-sm leading-tight">Install NBF HOMES</h3>
                        <p className="text-xs text-neutral-500 mt-0.5">For the best experience!</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleInstallClick}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full h-8 px-4 text-xs transition-colors shadow-sm"
                    >
                        Install Now
                    </Button>
                    <button
                        onClick={handleDismiss}
                        className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
                        aria-label="Dismiss"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
