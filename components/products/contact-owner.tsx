'use client';

import { Button } from '@/components/ui/button';
import { trackLeadActivity } from '@/app/actions';
import { Product } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import { LoginModal } from '@/components/auth/login-modal';
import { ContactOptionsModal } from './contact-options-modal';
import { FraudWarningModal } from './fraud-warning-modal';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export function ContactOwner({ product, className }: { product: Product; className?: string }) {
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showFraudModal, setShowFraudModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [intendedAction, setIntendedAction] = useState<'contact' | 'whatsapp' | null>(null);

  const handleContactClick = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setIntendedAction('contact');
    setShowFraudModal(true);
  };

  const handleWhatsAppClick = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setIntendedAction('whatsapp');
    setShowFraudModal(true);
  };

  const executeWhatsAppAction = async () => {
    // 1. Track Lead
    if (user) {

      await trackLeadActivity({
        propertyId: product.id,
        actionType: 'whatsapp',
        ownerId: product.userId || null
      });
    }

    // 2. Open WhatsApp
    const contactNumber = product.contactNumber || '';
    if (!contactNumber) {
      toast.error("Contact number not available");
      return;
    }

    const currentUrl = window.location.href;
    const city = product.tags?.[1] || 'Unknown City';
    const rent = (product.price || product.priceRange?.minVariantPrice?.amount)
      ? Math.round(Number(product.price || product.priceRange?.minVariantPrice?.amount)).toLocaleString('en-IN')
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

  const executeContactAction = async () => {
    // 1. Track Lead
    if (user) {
      await trackLeadActivity({
        propertyId: product.id,
        actionType: 'contact',
        ownerId: product.userId || null
      });
    }

    // 2. Show Options or Redirect
    // If we want to scroll to form:
    const contactSection = document.getElementById('contact-form-section');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      setShowContactModal(true);
    }
  };

  return (
    <div className={`flex gap-3 w-full ${className}`}>
      {/* Contact Owner Button */}
      <Button
        className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white font-bold uppercase tracking-widest text-xs h-12 rounded-xl shadow-md"
        onClick={handleContactClick}
      >
        Contact
      </Button>

      {/* WhatsApp Button */}
      <Button
        className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold uppercase tracking-widest text-xs h-12 rounded-xl shadow-md"
        onClick={handleWhatsAppClick}
      >
        <MessageCircle className="w-5 h-5 mr-2" />
        WhatsApp
      </Button>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

      <FraudWarningModal
        isOpen={showFraudModal}
        onClose={() => setShowFraudModal(false)}
        onConfirm={() => {
          setShowFraudModal(false);
          if (intendedAction === 'whatsapp') {
            executeWhatsAppAction();
          } else {
            executeContactAction();
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
