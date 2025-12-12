'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Copy, Share2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyTitle: string;
  propertyUrl: string;
}

export function ShareModal({ isOpen, onClose, propertyTitle, propertyUrl }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [fullUrl, setFullUrl] = useState('');

  useEffect(() => {
    // Construct full URL on client side to avoid window is not defined error
    if (typeof window !== 'undefined') {
      setFullUrl(`${window.location.origin}${propertyUrl}`);
    }
  }, [propertyUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      alert('Failed to copy URL. Please try again.');
    }
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: `Check out this property: ${propertyTitle}`,
        text: `I found this property on NBFHOMES: ${propertyTitle}`,
        url: fullUrl
      };

      if (navigator.share) {
        await navigator.share(shareData);
        onClose();
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden bg-white rounded-xl">
        <div className="p-6 flex flex-col gap-4">
          <DialogHeader className="flex flex-col items-center text-center gap-2 space-y-0">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <Share2 className="w-6 h-6 text-blue-600" />
            </div>
            <DialogTitle className="text-xl font-serif font-normal text-neutral-900">Share this property</DialogTitle>
            <p className="text-sm text-neutral-500">
              Share this property with friends or on social media
            </p>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Share2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-neutral-900">Share via</h4>
                <p className="text-sm text-neutral-500">Use your device's native share options</p>
              </div>
              <Button
                onClick={handleShare}
                className="ml-auto px-4 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Share Now
              </Button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
              <div className="w-8 h-8 bg-neutral-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Copy className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-neutral-900">Copy link</h4>
                <p className="text-sm text-neutral-500">Copy the property link to share manually</p>
              </div>
              <Button
                onClick={handleCopy}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg ${copied ? 'bg-green-600 hover:bg-green-700' : 'bg-neutral-600 hover:bg-neutral-700'} text-white`}
                disabled={copied}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-100">
            <Input
              type="text"
              value={fullUrl}
              readOnly
              className="text-sm text-neutral-600 bg-neutral-100 border-neutral-200"
            />
            <p className="text-xs text-neutral-400 mt-2 text-center">
              You can also share this link directly
            </p>
          </div>

          <Button
            onClick={onClose}
            variant="outline"
            className="w-full mt-2 border-neutral-200 text-neutral-600 hover:bg-neutral-50"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}