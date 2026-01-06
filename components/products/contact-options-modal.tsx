'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, User } from 'lucide-react';
import { Product } from '@/lib/types';

interface ContactOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product;
}

export function ContactOptionsModal({ isOpen, onClose, product }: ContactOptionsModalProps) {
    const ownerName = product.ownerName || "Property Owner";
    const contactNumber = product.contactNumber || '';

    const handleWhatsApp = () => {
        if (!contactNumber) {
            alert("Contact number not available");
            return;
        }

        const currentUrl = window.location.href;
        const city = product.tags?.[1] || 'Unknown City';
        const rent = product.priceRange?.minVariantPrice?.amount
            ? Math.round(Number(product.priceRange.minVariantPrice.amount)).toLocaleString('en-IN')
            : 'N/A';

        const message = `Hi, I'm interested in this property of yours: 
🏠 Property: ${product.title}
📍 City: ${city}
💰 Rent: ₹${rent}/month
🔗 Link: ${currentUrl}
Please let me know more.`;

        // Remove any non-digit characters for the WhatsApp link
        const cleanNumber = contactNumber.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px] bg-white rounded-xl p-0 overflow-hidden gap-0">

                <div className="p-6 flex flex-col gap-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif text-center text-neutral-900">Contact Owner</DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col items-center text-center gap-2">
                        <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-2 border border-neutral-200">
                            <User className="w-10 h-10 text-neutral-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-neutral-900">{ownerName}</h3>
                            <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium mb-1">Verified Seller</p>
                            {contactNumber && (
                                <p className="text-sm font-mono text-neutral-600 bg-neutral-50 px-2 py-1 rounded inline-block">
                                    {contactNumber}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-3 mt-2">
                        <Button
                            asChild
                            className="w-full bg-neutral-900 hover:bg-neutral-800 text-white h-12 text-sm uppercase tracking-widest font-bold shadow-sm cursor-pointer"
                        >
                            <a href={`tel:${contactNumber}`}>
                                <Phone className="w-4 h-4 mr-3" />
                                Call Owner
                            </a>
                        </Button>
                        <Button
                            onClick={handleWhatsApp}
                            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white h-12 text-sm uppercase tracking-widest font-bold shadow-sm border-none"
                        >
                            <MessageCircle className="w-4 h-4 mr-3" />
                            Chat on WhatsApp
                        </Button>
                    </div>
                </div>

                <div className="bg-neutral-50 p-4 text-center border-t border-neutral-100">
                    <p className="text-[10px] text-neutral-400">
                        By contacting, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>

            </DialogContent>
        </Dialog>
    );
}
