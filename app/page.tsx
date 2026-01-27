import { PageLayout } from '@/components/layout/page-layout';
import { LatestProperties } from '@/components/home/latest-properties';
import { Suspense } from 'react';
import { ProductsSkeleton } from '@/components/home/products-skeleton';

// Mark as dynamic to avoid "Dynamic server usage" errors with cookies in getAdSettingsAction
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <PageLayout>
      <div className="space-y-8">
        {/* Hero Section or other static parts can go here if separated */}

        <Suspense fallback={<ProductsSkeleton />}>
          <LatestProperties />
        </Suspense>
      </div>
    </PageLayout>
  );
}
