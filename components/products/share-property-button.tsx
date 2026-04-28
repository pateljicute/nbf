'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { ShareModal } from '@/components/ui/share-modal';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface SharePropertyButtonProps {
    product: Product;
    className?: string;
    variant?: 'default' | 'outline' | 'ghost' | 'secondary';
}

export function SharePropertyButton({ product, className, variant = 'outline' }: SharePropertyButtonProps) {
    const [showShareModal, setShowShareModal] = useState(false);
    // If className contains 'aspect-square', render icon-only
    const isIconOnly = className?.includes('aspect-square');

    return (
        <>
            <Button
                variant={variant}
                className={className}
                onClick={() => setShowShareModal(true)}
                title="Share Property"
            >
                <Share2 className={isIconOnly ? 'w-4 h-4' : 'w-4 h-4 mr-2'} />
                {!isIconOnly && 'Share'}
            </Button>
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                product={product}
            />
        </>
    );
}
