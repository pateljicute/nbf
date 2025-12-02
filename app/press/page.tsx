import { PageLayout } from '@/components/layout/page-layout';
import { PressContent } from './press-content';

export const metadata = {
    title: 'Press | NBFHOMES',
    description: 'Latest news and updates from NBFHOMES.',
};

export default function PressPage() {
    return (
        <PageLayout>
            <PressContent />
        </PageLayout>
    );
}
