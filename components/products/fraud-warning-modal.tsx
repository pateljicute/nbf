'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Ban } from 'lucide-react';

interface FraudWarningModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function FraudWarningModal({ isOpen, onClose, onConfirm }: FraudWarningModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px] p-0 gap-0 overflow-hidden bg-white rounded-xl">
                <div className="p-8 flex flex-col gap-6">

                    {/* Header with Icon */}
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="bg-red-50 p-4 rounded-full">
                            <ShieldAlert className="w-8 h-8 text-red-600" />
                        </div>
                        <DialogTitle className="text-3xl font-serif font-medium text-neutral-900">
                            Safety Warning
                        </DialogTitle>
                    </div>

                    {/* Warning Box */}
                    <div className="bg-neutral-50 border border-neutral-100 rounded-lg p-4 text-center">
                        <p className="text-sm font-medium text-neutral-900 leading-relaxed">
                            Do not pay or transfer any money to owners before meeting them in person.
                        </p>
                    </div>

                    {/* List Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider text-center">
                            Genuine owners will not ask for:
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                'Entry Pass Fees',
                                'Booking Amount / Token',
                                'Property Visit Charges'
                            ].map((item, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 border border-neutral-100 rounded-lg bg-white">
                                    <Ban className="w-4 h-4 text-red-500 shrink-0" />
                                    <span className="text-sm font-medium text-neutral-700">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Disclaimer Text */}
                    <p className="text-xs text-neutral-500 text-center leading-relaxed px-4">
                        Anyone asking for such fees might be a fraudster. We have no control over transactions made outside our platform. Please exercise caution.
                    </p>

                    {/* Action Button */}
                    <Button
                        onClick={onConfirm}
                        className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-6 text-sm uppercase tracking-widest shadow-sm transition-all"
                    >
                        I Understand, Proceed
                    </Button>

                </div>
            </DialogContent>
        </Dialog>
    );
}
