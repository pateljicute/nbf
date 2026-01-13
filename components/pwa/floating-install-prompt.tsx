"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";

export function FloatingInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // 1. Capture browser install event
        const handler = (e: any) => {
            e.preventDefault();
            console.log('Prompt Captured');
            setDeferredPrompt(e);
            // Show after 3 seconds on first visit
            setTimeout(() => setIsVisible(true), 3000);
        };

        const init = () => {
            // Check availability of manifest
            const manifestLink = document.querySelector('link[rel="manifest"]');
            if (manifestLink) {
                console.log('Manifest Loaded:', manifestLink.getAttribute('href'));
            } else {
                console.error('Manifest NOT Loaded');
            }
            window.addEventListener("beforeinstallprompt", handler);
        };

        if (document.readyState === 'complete') {
            init();
        } else {
            window.addEventListener('load', init);
        }

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
            window.removeEventListener('load', init);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        // 2. Show actual browser prompt
        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            console.log("User installed the app");
        }
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    const handleDismiss = () => {
        setIsVisible(false);
    };

    if (!isVisible || !deferredPrompt) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className="fixed top-5 left-5 right-5 z-[100] md:max-w-xl md:mx-auto"
            >
                <div className="bg-[#1A1A1A] text-white p-4 rounded-xl shadow-2xl border border-zinc-800 flex items-center justify-between gap-4">
                    <div className="flex-1">
                        <h3 className="font-bold text-base">Install NBF HOMES App</h3>
                        <p className="text-sm text-gray-400">For a faster, better experience.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleInstall}
                            className="bg-white text-black px-4 py-2 rounded-full text-sm font-bold shadow-lg active:scale-95 transition-transform flex items-center gap-2 hover:bg-gray-100"
                        >
                            <Download size={16} />
                            INSTALL
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                        >
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
