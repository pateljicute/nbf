'use client';

import { Suspense } from 'react';
import { Toaster } from 'sonner';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { AuthProvider } from '@/lib/auth-context';
import { RealtimeProvider } from '@/lib/realtime-context';
import { LocationProvider } from '@/lib/location-context';
import { ListingModeProvider, ModeUrlSync } from '@/lib/listing-mode-context';
import { Header } from '@/components/layout/header';
import { LocationPermissionModal } from '@/components/modals/location-permission-modal';
import { Collection } from '@/lib/types';
import { LoaderProvider } from '@/context/loader-context';
import { PropertyLoader } from '@/components/ui/property-loader';
import { ReviewProvider } from '@/lib/review-context';

export function ProvidersWrapper({
    children,
    collections
}: {
    children: React.ReactNode;
    collections: Collection[]
}) {
    return (
        <LoaderProvider>
            <AuthProvider>
                <ListingModeProvider>
                    {/* ModeUrlSync reads ?mode= from URL — must be inside Suspense */}
                    <Suspense fallback={null}>
                        <ModeUrlSync />
                    </Suspense>
                    <LocationProvider>
                        <RealtimeProvider>
                            <ReviewProvider>
                                <NuqsAdapter>
                                    <Header collections={collections} />
                                    <LocationPermissionModal />
                                    <PropertyLoader />
                                    <Suspense>{children}</Suspense>
                                    <Toaster closeButton position="bottom-right" />
                                </NuqsAdapter>
                            </ReviewProvider>
                        </RealtimeProvider>
                    </LocationProvider>
                </ListingModeProvider>
            </AuthProvider>
        </LoaderProvider>
    );
}
