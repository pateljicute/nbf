import { getProducts } from '@/lib/api';
import { HomeClient } from '@/components/home/home-client';
import { AdSettings, Product } from '@/lib/types';
import { getAdSettingsAction } from '@/app/actions';

export async function LatestProperties() {
    let featuredProducts: Product[] = [];
    let adSettings: AdSettings | null = null;

    try {
        // Parallel data fetching for speed
        const [products, adRes] = await Promise.all([
            getProducts({ limit: 12 }),
            getAdSettingsAction()
        ]);

        featuredProducts = products;
        if (adRes.success && adRes.data) {
            adSettings = adRes.data as AdSettings;
        }
    } catch (error) {
        console.error('Error fetching home data:', error);
        featuredProducts = [];
    }

    return (
        <HomeClient initialProducts={featuredProducts} adSettings={adSettings} />
    );
}
