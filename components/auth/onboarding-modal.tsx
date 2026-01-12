'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/db';
import { useAuth } from '@/lib/auth-context';

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

export function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
    const { user } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'input' | 'success'>('input');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !phoneNumber) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({ contact_number: phoneNumber })
                .eq('id', user.id);

            if (error) throw error;

            setStep('success');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinGroup = () => {
        // Replace with actual group link
        window.open('https://chat.whatsapp.com/EU9XWi6BWilIrRGnkPB7eJ', '_blank');
        onComplete();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-white rounded-2xl border-0 shadow-xl" onPointerDownOutside={(e) => e.preventDefault()}>
                <div className="relative h-32 bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg ring-4 ring-white/10">
                        <MessageCircle className="w-8 h-8 text-white fill-current" />
                    </div>
                </div>

                <div className="p-8">
                    {step === 'input' ? (
                        <form onSubmit={handleSubmit} className="flex flex-col text-center space-y-6">
                            <div className="space-y-2">
                                <DialogTitle className="text-2xl font-bold text-neutral-900 tracking-tight">Welcome to NBF HOMES!</DialogTitle>
                                <p className="text-neutral-500">
                                    Enter your WhatsApp number to receive exclusive property deals and updates directly!
                                </p>
                            </div>

                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium z-10">Use WhatsApp</span>
                                <Input
                                    type="tel"
                                    placeholder="e.g. +91 7470724553"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="pl-4 h-12 text-lg text-center font-medium bg-neutral-50 border-neutral-200 focus:border-green-500 focus:ring-green-500/20"
                                    required
                                    autoFocus
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold text-lg shadow-lg shadow-green-600/20 rounded-xl transition-all"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Get Best Deals'}
                            </Button>
                            <p className="text-xs text-neutral-400 mt-4">
                                We respect your privacy. No spam, ever.
                            </p>
                        </form>
                    ) : (
                        <div className="flex flex-col items-center text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-2">
                                <DialogTitle className="text-2xl font-bold text-neutral-900">You're all set! 🎉</DialogTitle>
                                <p className="text-neutral-500 max-w-[280px] mx-auto">
                                    Join our exclusive WhatsApp community for the fastest updates.
                                </p>
                            </div>

                            <Button
                                onClick={handleJoinGroup}
                                className="w-full h-12 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-lg shadow-lg shadow-green-500/20 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <MessageCircle className="w-5 h-5 fill-current" />
                                Join WhatsApp Group
                            </Button>

                            <button
                                onClick={onComplete}
                                className="text-sm text-neutral-400 hover:text-neutral-600 font-medium transition-colors"
                            >
                                Maybe later
                            </button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
