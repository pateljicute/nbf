'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return;
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Only show prompt if not already dismissed by user selection in this session? 
            // User requirements: "When a user opens the site on mobile, show them a beautiful 'Install Infhomes App' banner"

            // Let's delay it slightly to not annoy immediately or check local storage if dismissed recently
            const hasDismissed = sessionStorage.getItem('install_prompt_dismissed');
            if (!hasDismissed) {
                setIsVisible(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

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
            <div className="bg-neutral-900 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between gap-4 border border-neutral-800 mx-auto max-w-md">
                <div className="flex items-center gap-3">
                    <div className="bg-white rounded-lg p-1 w-10 h-10 flex items-center justify-center">
                        {/* Placeholder for App Icon if valid image not ready, or actual img tag */}
                        <span className="text-black font-bold text-lg">IH</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Install Infhomes</h3>
                        <p className="text-xs text-neutral-400">Add to Home Screen</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleInstallClick}
                        size="sm"
                        className="bg-white text-black hover:bg-neutral-200 font-bold rounded-full h-8 px-4 text-xs"
                    >
                        Install
                    </Button>
                    <button onClick={handleDismiss} className="text-neutral-400 hover:text-white">
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
