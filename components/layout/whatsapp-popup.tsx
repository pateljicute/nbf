'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, MessageCircle } from 'lucide-react';

export function WhatsappPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        const checkTimer = () => {
            // Check if already shown
            if (localStorage.getItem('nbf_wa_popup_shown')) return;

            // Check if profile was saved
            const savedTimestamp = localStorage.getItem('nbf_profile_saved_timestamp');
            if (!savedTimestamp) return;

            const timePassed = Date.now() - parseInt(savedTimestamp);
            const delay = 60000; // 60 seconds

            if (timePassed >= delay) {
                setIsOpen(true);
            } else {
                // If time hasn't passed, check again when it should have
                const remaining = delay - timePassed;
                setTimeout(() => setIsOpen(true), remaining);
            }
        };

        // Check immediately on mount
        checkTimer();

        // Also set up an interval to check periodically (e.g. every 5s) just in case
        // though the setTimeout above handles the main logic.
        const interval = setInterval(() => {
            checkTimer();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        // Mark as shown so it doesn't appear again
        localStorage.setItem('nbf_wa_popup_shown', 'true');
    };

    const handleJoin = () => {
        window.open('https://chat.whatsapp.com/EU9XWi6BWilIrRGnkPB7eJ', '_blank');
        handleClose();
    };

    if (!mounted) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md bg-white border-neutral-200 text-neutral-900 p-0 overflow-hidden shadow-2xl">

                {/* Header / Banner Image Area */}
                <div className="bg-[#25D366] p-6 text-center text-white relative">
                    <button
                        onClick={handleClose}
                        className="absolute top-2 right-2 p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-lg">
                        <MessageCircle className="w-10 h-10 text-[#25D366] fill-[#25D366]" />
                    </div>
                    <DialogTitle className="text-2xl font-bold text-white mb-1">
                        Join Our Community!
                    </DialogTitle>
                </div>

                <div className="p-6 text-center space-y-5">
                    <DialogDescription className="text-base text-neutral-600 font-medium">
                        Join the exclusive group of <span className="font-bold text-neutral-900">NBF Homes</span> and be the first to know about new properties!
                    </DialogDescription>

                    <Button
                        onClick={handleJoin}
                        className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-lg py-6 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                    >
                        <MessageCircle className="w-6 h-6 mr-2 fill-white" />
                        Join WhatsApp Group
                    </Button>

                    <button onClick={handleClose} className="text-xs text-neutral-400 hover:text-neutral-600 underline">
                        No thanks, I'll join later
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
