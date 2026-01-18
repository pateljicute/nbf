'use client';

import { useEffect } from 'react';
import { trackPropertyView } from '@/app/actions';

export function ViewTracker({ propertyId }: { propertyId: string }) {
    useEffect(() => {
        trackPropertyView(propertyId).catch(console.error);
    }, [propertyId]);

    return null;
}
