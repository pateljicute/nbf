'use client';

import { useEffect, useRef } from 'react';
import { incrementViewCount } from '@/app/actions/view-actions';

export function ViewTracker({ productId }: { productId: string }) {
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;

            // Spam Protection: Check if already viewed in this session
            const storageKey = `viewed_property_${productId}`;
            if (typeof window !== 'undefined' && !sessionStorage.getItem(storageKey)) {
                incrementViewCount(productId)
                    .then(() => sessionStorage.setItem(storageKey, 'true'))
                    .catch(console.error);
            }
        }
    }, [productId]);

    return null;
}
