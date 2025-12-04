'use client';

import { Button } from '@/components/ui/button';
import { Product } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import { LoginModal } from '@/components/auth/login-modal';
import { FraudWarningModal } from './fraud-warning-modal';
import { ContactOptionsModal } from './contact-options-modal';

export function ContactOwner({ product, className }: { product: Product; className?: string }) {
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showFraudModal, setShowFraudModal] = useState(false);
  const [showContactOptions, setShowContactOptions] = useState(false);

  const handleContact = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setShowFraudModal(true);
  };

  const onConfirmContact = () => {
    setShowFraudModal(false);
    setShowContactOptions(true);
  };

  return (
    <>
      <Button
        className={className}
        onClick={handleContact}
      >
        Contact Owner
      </Button>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <FraudWarningModal
        isOpen={showFraudModal}
        onClose={() => setShowFraudModal(false)}
        onConfirm={onConfirmContact}
      />
      <ContactOptionsModal
        isOpen={showContactOptions}
        onClose={() => setShowContactOptions(false)}
        product={product}
      />
    </>
  );
}
