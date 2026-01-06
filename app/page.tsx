import { PageLayout } from '@/components/layout/page-layout';
import { getProducts } from '@/lib/api';
import { getAdSettingsAction } from '@/app/actions';
import { Product, AdSettings } from '../lib/types';
import { HomeClient } from '@/components/home/home-client';

// Cache for 0 seconds (dynamic) to ensure SEO updates are reflected immediately during dev
export const revalidate = 0;

export default async function Home() {
  let featuredProducts: Product[] = [];
  let adSettings: AdSettings | null = null;

  try {
    // Limit to 12 products for better performance
    const allProducts = await getProducts({ limit: 12 });
    featuredProducts = allProducts;

    // Fetch Ad Settings
    const adRes = await getAdSettingsAction();
    if (adRes.success && adRes.data) {
      adSettings = adRes.data as AdSettings;
    }
  } catch (error) {
    console.error('Error fetching home data:', error);
    featuredProducts = [];
  }

  return (
    <PageLayout>
      <HomeClient initialProducts={featuredProducts} adSettings={adSettings} />
    </PageLayout>
  );
}
