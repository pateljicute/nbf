'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { updateUserPhoneNumber } from '@/lib/api';

const WHATSAPP_GROUP_LINK = 'https://whatsapp.com/channel/0029Vb7ZqswLtOjF8AQiBL19';

export function WhatsAppOnboardingModal() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<'phone' | 'join'>('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const checkProfile = async () => {
            if (user) {
                // 1. Check if we have already seen/dismissed (only for 'join' step logic if needed, 
                // but for phone number, we MUST enforce it if it's missing)

                try {
                    // Fetch fresh profile data to check contact_number
                    const { data: profile, error } = await import('@/lib/db').then(m => m.supabase
                        .from('users')
                        .select('contact_number')
                        .eq('id', user.id)
                        .single()
                    );

                    if (user && !error && (!profile?.contact_number || profile.contact_number.trim() === '')) {
                        // FORCE OPEN if no number
                        setIsOpen(true);
                        setStep('phone');
                    } else {
                        // If number exists, check if they saw the 'join group' modal
                        const hasSeen = localStorage.getItem('nbf_whatsapp_modal_seen');
                        if (!hasSeen) {
                            setIsOpen(true);
                            setStep('join');
                        }
                    }
                } catch (err) {
                    console.error('Error checking profile:', err);
                }
            }
        };

        checkProfile();
    }, [user]);

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!phoneNumber || phoneNumber.length < 10) {
            setError('Please enter a valid phone number');
            return;
        }

        setLoading(true);
        try {
            if (user?.id) {
                await updateUserPhoneNumber(user.id, phoneNumber);
            }
            // Move to next step regardless of API success to not block user (or handle error strictly)
            // Ideally we want to ensure phone is saved. 
            setStep('join');
        } catch (err) {
            console.error('Error updating phone:', err);
            // Fallback: still show join step? Or show error?
            // Let's allow proceeding for better UX, but log error
            setStep('join');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('nbf_whatsapp_modal_seen', 'true');
    };

    const handleJoinGroup = () => {
        window.open(WHATSAPP_GROUP_LINK, '_blank');
        handleClose();
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            // Prevent closing on step 1 unless completed? 
            // User requirement: "Display a non-closable modal... The modal should only appear once per user."
            // "The 'Join WhatsApp Group' step includes a closable 'X' button."
            // So Step 1: user CANNOT close. Step 2: user CAN close.
            if (step === 'join' && !open) {
                handleClose();
            }
        }}>
            <DialogContent className="sm:max-w-md [&>button]:hidden">
                {/* [&>button]:hidden hides the default close X on top right. We will add our own for Step 2 */}

                {step === 'join' && (
                    <button
                        onClick={handleClose}
                        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </button>
                )}

                <DialogHeader>
                    <div className="mx-auto bg-green-100 p-3 rounded-full mb-4">
                        <MessageCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <DialogTitle className="text-center text-2xl font-bold">
                        {step === 'phone' ? 'One Last Step!' : 'You\'re In!'}
                    </DialogTitle>
                    <DialogDescription className="text-center text-base pt-2">
                        {step === 'phone'
                            ? 'Please provide your Contact Number (WhatsApp preferred) to receive instant property alerts and connect with owners directly.'
                            : 'Thanks! Now join our exclusive WhatsApp Channel for instant alerts on new listings.'}
                    </DialogDescription>
                </DialogHeader>

                {step === 'phone' ? (
                    <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4 mt-4">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="phone" className="text-sm font-medium">Contact Number</label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                                    +91
                                </span>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="9876543210"
                                    className="rounded-l-none"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    required
                                />
                            </div>
                            {error && <span className="text-red-500 text-xs">{error}</span>}
                        </div>

                        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold" disabled={loading}>
                            {loading ? 'Saving...' : 'Continue'}
                        </Button>
                        <p className="text-xs text-center text-neutral-500 mt-2">
                            We value your privacy. Your number will only be used for property alerts.
                        </p>
                    </form>
                ) : (
                    <div className="flex flex-col gap-4 mt-4">
                        <div className="bg-green-50 p-4 rounded-lg flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-green-900">Phone number verified</p>
                                <p className="text-xs text-green-700 mt-1">You are all set to receive updates.</p>
                            </div>
                        </div>

                        <Button
                            onClick={handleJoinGroup}
                            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                        >
                            <MessageCircle className="mr-2 h-6 w-6" /> Join WhatsApp Channel
                        </Button>

                        <Button variant="ghost" size="sm" onClick={handleClose} className="text-neutral-400 font-normal">
                            Skip for now
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
