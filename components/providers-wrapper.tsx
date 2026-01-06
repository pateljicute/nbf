'use client';

import { Suspense } from 'react';
import { Toaster } from 'sonner';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { AuthProvider } from '@/lib/auth-context';
import { RealtimeProvider } from '@/lib/realtime-context';
import { Header } from '@/components/layout/header';
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
            <RealtimeProvider>
                <NuqsAdapter>
                    <Header collections={collections} />
                    <Suspense>{children}</Suspense>
                    <Toaster closeButton position="bottom-right" />
                </NuqsAdapter>
            </RealtimeProvider>
        </AuthProvider>
    );
}
