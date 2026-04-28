'use client';

import { Button } from '@/components/ui/button';
import { trackLeadActivity } from '@/app/actions';
import { Product } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import { LoginModal } from '@/components/auth/login-modal';
import { ContactOptionsModal } from './contact-options-modal';
import { FraudWarningModal } from './fraud-warning-modal';
import { MessageCircle, BadgeCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useReviews } from '@/lib/review-context';

export function ContactOwner({ product, className }: { product: Product; className?: string }) {
  const { user } = useAuth();
  const { trackPropertyContact } = useReviews();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showFraudModal, setShowFraudModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [intendedAction, setIntendedAction] = useState<'contact' | 'whatsapp' | null>(null);

  const handleContactClick = () => {
    if (!user) { setShowLoginModal(true); return; }
    setIntendedAction('contact');
    setShowFraudModal(true);
  };

  const handleWhatsAppClick = () => {
    if (!user) { setShowLoginModal(true); return; }
    setIntendedAction('whatsapp');
    setShowFraudModal(true);
  };

  const executeWhatsAppAction = async () => {
    trackPropertyContact(product.id);
    if (user) {
      await trackLeadActivity({ propertyId: product.id, actionType: 'whatsapp', ownerId: product.userId || null });
    }
    const contactNumber = product.contactNumber || '';
    if (!contactNumber) { toast.error("Contact number not available"); return; }
    const currentUrl = window.location.href;
    const city = product.tags?.[1] || 'Unknown City';
    const rent = (product.price || product.priceRange?.minVariantPrice?.amount)
      ? Math.round(Number(product.price || product.priceRange?.minVariantPrice?.amount)).toLocaleString('en-IN')
      : 'N/A';
    const message = `Hello, I'm interested in your property and would like to view it:\n\n🏠 Property : ${product.title}\n📍 City : ${city}\n💰 Rent : ₹${rent}/month\n🔗 Link : ${currentUrl}\n\nCan I visit it tomorrow?`;
    window.open(`https://wa.me/${contactNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const executeContactAction = async () => {
    trackPropertyContact(product.id);
    if (user) {
      await trackLeadActivity({ propertyId: product.id, actionType: 'contact', ownerId: product.userId || null });
    }
    const contactSection = document.getElementById('contact-form-section');
    if (contactSection) contactSection.scrollIntoView({ behavior: 'smooth' });
    else setShowContactModal(true);
  };

  const isVerified = (product as any).is_verified;

  return (
    <div className={`flex gap-3 w-full ${className}`}>
      {/* Contact Button */}
      <Button
        className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white font-bold uppercase tracking-widest text-xs h-10 md:h-12 rounded-xl shadow-md"
        onClick={handleContactClick}
      >
        Contact
      </Button>
      {/* WhatsApp Button */}
      <Button
        className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold uppercase tracking-widest text-xs h-10 md:h-12 rounded-xl shadow-md"
        onClick={handleWhatsAppClick}
      >
        <MessageCircle className="w-4 h-4 mr-1.5" />
        WhatsApp
      </Button>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <FraudWarningModal
        isOpen={showFraudModal}
        onClose={() => setShowFraudModal(false)}
        onConfirm={() => {
          setShowFraudModal(false);
          if (intendedAction === 'whatsapp') executeWhatsAppAction();
          else executeContactAction();
        }}
      />
      <ContactOptionsModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} product={product} />
    </div>
  );
}
