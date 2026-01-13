'use client';

import { useState, useEffect } from 'react';
import { X, Smartphone, Download } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from "@/components/ui/use-toast";

export function SmartInstallBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const { toast } = useToast();

    useEffect(() => {
        // 1. Check if app is already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        if (isStandalone) return;

        // 2. Check local storage for cooldown (24h)
        const dismissedAt = localStorage.getItem('nbf_install_dismissed');
        if (dismissedAt) {
            const hoursSinceDismissal = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
            if (hoursSinceDismissal < 24) return;
        }

        // 3. Listen for install prompt
        const handler = (e: any) => {
            e.preventDefault();
            setInstallPrompt(e);
            // Slight delay for better UX
            setTimeout(() => setIsVisible(true), 2000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Fallback: Show banner anyway for awareness if not installed (even if prompt not ready immediately)
        // Checking "not standalone" again just to be safe
        if (!isStandalone && !dismissedAt) {
            setTimeout(() => setIsVisible(true), 3000);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

        if (isIOS) {
            toast({
                title: "Install on iOS",
                description: 'Tap "Share" -> "Add to Home Screen"',
                duration: 5000,
            });
        } else if (installPrompt) {
            installPrompt.prompt();
            const { outcome } = await installPrompt.userChoice;
            if (outcome === 'accepted') {
                setIsVisible(false);
            }
        } else {
            console.log("App is already installed or prompt not ready");
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem('nbf_install_dismissed', Date.now().toString());
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="fixed top-0 left-0 right-0 z-50 bg-neutral-900/95 backdrop-blur-md text-white px-4 py-3 shadow-2xl border-b border-white/10"
                >
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2 rounded-lg hidden sm:block">
                                <Smartphone className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">Install NBF HOMES App</p>
                                <p className="text-xs text-neutral-400">For a faster, better experience.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleInstall}
                                className="flex items-center gap-2 bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors"
                                style={{ minWidth: '100px', justifyContent: 'center' }}
                            >
                                <Download className="w-3 h-3" />
                                Install
                            </button>
                            <button
                                onClick={handleClose}
                                className="p-1 rounded-full hover:bg-white/10 transition-colors text-neutral-400 hover:text-white"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
