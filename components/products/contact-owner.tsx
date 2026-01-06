'use client';

import { Button } from '@/components/ui/button';
import { trackLead } from '@/lib/api';
import { Product } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import { LoginModal } from '@/components/auth/login-modal';
import { ContactOptionsModal } from './contact-options-modal';
import { FraudWarningModal } from './fraud-warning-modal';
import { MessageCircle } from 'lucide-react';

export function ContactOwner({ product, className }: { product: Product; className?: string }) {
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showFraudModal, setShowFraudModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [intendedAction, setIntendedAction] = useState<'contact' | 'whatsapp' | null>(null);

  const handleContact = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setIntendedAction('contact');
    setShowFraudModal(true);
  };

  const handleWhatsApp = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setIntendedAction('whatsapp');
    setShowFraudModal(true);
  };

  const openWhatsApp = () => {
    const contactNumber = product.contactNumber || '';
    if (!contactNumber) {
      alert("Contact number not available");
      return;
    }

    // Construct rich message
    const currentUrl = window.location.href;
    const city = product.tags?.[1] || 'Unknown City';
    const rent = product.priceRange?.minVariantPrice?.amount
      ? Math.round(Number(product.priceRange.minVariantPrice.amount)).toLocaleString('en-IN')
      : 'N/A';

    const message = `Hello, I'm interested in your property and would like to view it:

🏠 Property : ${product.title}
📍 City : ${city}
💰 Rent : ₹${rent}/month (50% Discount Offer!)
🔗 Link : ${currentUrl}

Can I visit it tomorrow?`;

    const cleanNumber = contactNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-neutral-100 flex gap-4 md:static md:p-0 md:bg-transparent md:border-none md:gap-2 ${className}`}>
      <div className="flex gap-4 w-full md:gap-2">
        {/* Contact Owner Button */}
        <Button
          className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white font-bold uppercase tracking-widest text-[10px] sm:text-xs h-12 md:h-auto rounded-lg shadow-md"
          onClick={handleContact}
        >
          Contact
        </Button>

        {/* WhatsApp Button */}
        <Button
          className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold uppercase tracking-widest text-[10px] sm:text-xs h-12 md:h-auto rounded-lg shadow-md"
          onClick={handleWhatsApp}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          WhatsApp
        </Button>
      </div>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <FraudWarningModal
        isOpen={showFraudModal}
        onClose={() => setShowFraudModal(false)}
        onConfirm={() => {
          setShowFraudModal(false);
          if (intendedAction === 'whatsapp') {
            trackLead(product.id, 'whatsapp');
            openWhatsApp();
          } else {
            trackLead(product.id, 'contact');
            setShowContactModal(true);
          }
        }}
      />
      <ContactOptionsModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        product={product}
      />
    </div>
  );
}
