import { getProducts } from '@/lib/api';
import { PageLayout } from '@/components/layout/page-layout';
import { ProductGrid } from '@/app/properties/components/product-grid';
import { ProductCard } from '@/app/properties/components/product-card';
import { Metadata } from 'next';

interface Props {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const params = await props.params;
    const city = params.slug.charAt(0).toUpperCase() + params.slug.slice(1);
    return {
        title: `Properties in ${city} | NBF Homes`,
        description: `Find the best properties, apartments, and houses for rent in ${city}. Verified owners, zero brokerage.`,
    };
}

// 60-second revalidation (ISR) for fast loading
export const revalidate = 60;

export default async function CityPage(props: Props) {
    const params = await props.params;
    const cityName = params.slug;
    const prettyCityName = cityName.charAt(0).toUpperCase() + cityName.slice(1);

    // Fetch properties for this city
    // using the new case-insensitive 'city' filter in getProducts
    const products = await getProducts({
        city: cityName,
        limit: 24
    });

    return (
        <PageLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col gap-2 mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Properties in {prettyCityName}</h1>
                    <p className="text-neutral-500">
                        {products.length} {products.length === 1 ? 'property' : 'properties'} found in {prettyCityName}
                    </p>
                </div>

                {products.length > 0 ? (
                    <ProductGrid>
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </ProductGrid>
                ) : (
                    <div className="py-20 text-center">
                        <h3 className="text-xl font-medium text-neutral-900">No properties found in {prettyCityName}</h3>
                        <p className="text-neutral-500 mt-2">Try searching for a different city or check back later.</p>
                    </div>
                )}
            </div>
        </PageLayout>
    );
}
