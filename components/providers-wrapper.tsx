'use client';

import { Suspense } from 'react';
import { Toaster } from 'sonner';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { AuthProvider } from '@/lib/auth-context';
import { RealtimeProvider } from '@/lib/realtime-context';
import { LocationProvider } from '@/lib/location-context';
import { Header } from '@/components/layout/header';
import { LocationPermissionModal } from '@/components/modals/location-permission-modal';
import { Collection } from '@/lib/types';

export function ProvidersWrapper({
    children,
    collections
}: {
    children: React.ReactNode;
    collections: Collection[]
}) {
    return (
        <AuthProvider>
            <LocationProvider>
                <RealtimeProvider>
                    <NuqsAdapter>
                        <Header collections={collections} />
                        <LocationPermissionModal />
                        <Suspense>{children}</Suspense>
                        <Toaster closeButton position="bottom-right" />
                    </NuqsAdapter>
                </RealtimeProvider>
            </LocationProvider>
        </AuthProvider>
    );
}
