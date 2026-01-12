'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Copy, Share2, MessageCircle, MoreHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { incrementLeadsCountAction } from '@/app/actions/lead-actions';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export function ShareModal({ isOpen, onClose, product }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [fullUrl, setFullUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFullUrl(`${window.location.origin}/product/${product.handle}`);
    }
  }, [product.handle]);

  const handleCopy = async () => {
    // Track Lead
    incrementLeadsCountAction(product.id);

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      alert('Failed to copy URL. Please try again.');
    }
  };

  const handleWhatsAppShare = () => {
    // Track Lead via Server Action (Robust)
    incrementLeadsCountAction(product.id);

    // Data Collection with Fallbacks
    const rent = Number(product.price || product.priceRange?.minVariantPrice?.amount || 0).toLocaleString('en-IN');
    const tenant = product.tenantPreference || 'Any';
    const bathroom = product.bathroom_type || 'Standard';
    const electricity = product.electricityStatus || 'Standard';
    const type = product.type || 'Flat';
    // const amenities = product.amenities?.length ? product.amenities.join(', ') : 'Contact for details';
    // Shorten amenities for better formatting if needed, but user asked for "amenities"
    const amenities = product.amenities?.slice(0, 5).join(', ') + (product.amenities && product.amenities.length > 5 ? '...' : '') || 'Contact for details';
    const address = product.address || product.location || 'Ask for full address';
    // const mapLink = product.googleMapsLink || 'Ask for location'; 
    // User requested "Link Copied!" for copy, but for WA message we need the actual link in the text.

    // Professional Formatting
    const message = `🏠 NBF HOMES - Property Details

    💰 Rent: ₹${rent} | 👥 Tenant: ${tenant}
    
    🚿 Bath: ${bathroom} | 🛋️ Amenities: ${amenities}
    
    📍 Address: ${address}
    
    🔗 Link: ${fullUrl}`;

    // Clean up extra spaces/newlines
    const cleanMessage = message.replace(/^\s+/gm, '').trim();

    const encodedMessage = encodeURIComponent(cleanMessage);
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = `whatsapp://send?text=${encodedMessage}`;
    } else {
      window.open(`https://web.whatsapp.com/send?text=${encodedMessage}`, '_blank');
    }
  };

  const handleNativeShare = async () => {
    // Track Lead
    incrementLeadsCountAction(product.id);

    try {
      const shareData = {
        title: `Check out this property: ${product.title}`,
        text: `I found this property on NBFHOMES: ${product.title}`,
        url: fullUrl
      };

      if (navigator.share) {
        await navigator.share(shareData);
        onClose();
      } else {
        alert('Sharing is not supported on this browser/device.');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-0 gap-0 overflow-hidden bg-white rounded-2xl shadow-2xl border-0">
        <div className="p-6 flex flex-col gap-6">
          <DialogHeader className="flex flex-col items-center text-center gap-2 space-y-0">
            <div className="w-14 h-14 bg-blue-50/80 rounded-full flex items-center justify-center mb-1 ring-1 ring-blue-100">
              <Share2 className="w-7 h-7 text-blue-600" />
            </div>
            <DialogTitle className="text-xl font-serif font-semibold text-neutral-900">Share Property</DialogTitle>
            <p className="text-sm text-neutral-500 max-w-[260px]">
              Share this property details with your friends and family
            </p>
          </DialogHeader>

          <div className="space-y-3">
            {/* Option 1: WhatsApp */}
            <button
              onClick={handleWhatsAppShare}
              className="w-full flex items-center gap-4 p-4 bg-green-50/50 hover:bg-green-50 border border-green-100 hover:border-green-200 rounded-xl transition-all group"
            >
              <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                <MessageCircle className="w-5 h-5 fill-current" />
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-neutral-900 group-hover:text-green-700 transition-colors">WhatsApp Share</h4>
                <p className="text-xs text-neutral-500">Share details directly on WhatsApp</p>
              </div>
            </button>

            {/* Option 2: Copy Link */}
            <div className="w-full flex items-center gap-4 p-4 bg-neutral-50 hover:bg-neutral-100 border border-neutral-100 hover:border-neutral-200 rounded-xl transition-all group relative overflow-hidden">
              <div className="w-10 h-10 bg-neutral-800 text-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </div>
              <div className="text-left flex-1">
                <h4 className="font-semibold text-neutral-900">Copy Link</h4>
                <p className="text-xs text-neutral-500">Copy link to clipboard</p>
              </div>
              <Button
                onClick={handleCopy}
                disabled={copied}
                variant="ghost"
                size="sm"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {copied && (
                <span className="absolute right-4 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full animate-in fade-in zoom-in duration-300">
                  Copied!
                </span>
              )}
            </div>

            {/* Option 3: More Options */}
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center gap-4 p-4 bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl transition-all group"
            >
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                <MoreHorizontal className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-neutral-900 group-hover:text-blue-700 transition-colors">More Options</h4>
                <p className="text-xs text-neutral-500">Share via other apps</p>
              </div>
            </button>
          </div>

          <div className="mt-2 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-neutral-100" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-neutral-400">or copy link below</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 p-2 bg-neutral-50 rounded-lg border border-neutral-200">
              <p className="flex-1 text-xs text-neutral-500 truncate px-2 font-mono">
                {fullUrl}
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-neutral-400 hover:text-neutral-900"
                onClick={handleCopy}
              >
                <Copy className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}