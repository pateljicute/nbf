'use client';

import { useState, useCallback } from 'react';
import { Hero } from '@/components/hero';
import { Product, AdSettings } from '@/lib/types';
import { LatestProductCard } from '@/components/products/latest-product-card';
import { AdSection } from '@/components/home/ad-section';
import Link from 'next/link';
import { AutoScroll } from '@/components/ui/auto-scroll';
import { MessageCircle } from 'lucide-react';
import { getLabelPosition } from '@/lib/utils';
import { INDIAN_CITIES } from '@/constants/cities';

interface HomeClientProps {
    initialProducts: Product[];
    adSettings?: AdSettings | null;
}

export function HomeClient({ initialProducts, adSettings }: HomeClientProps) {
    const [filteredProducts, setFilteredProducts] = useState(initialProducts);

    const handleSearch = useCallback((query: string) => {
        if (!query.trim()) {
            setFilteredProducts(initialProducts);
            return;
        }

        const lowerQuery = query.toLowerCase();

        // Filter products based on query matching Title, City, or Address
        const filtered = initialProducts.filter(product => {
            const titleMatch = product.title.toLowerCase().includes(lowerQuery);
            const cityMatch = product.tags?.[1]?.toLowerCase().includes(lowerQuery);
            const areaMatch = product.tags?.[2]?.toLowerCase().includes(lowerQuery);
            const addressMatch = product.description.toLowerCase().includes(lowerQuery);

            return titleMatch || cityMatch || areaMatch || addressMatch;
        });

        setFilteredProducts(filtered);
    }, [initialProducts]);

    return (
        <div className="flex flex-col gap-10 md:gap-24 pb-20 md:pb-0 overflow-y-auto overflow-x-hidden w-full">
            {/* Hero Section */}
            <div className="relative top-0 z-40 bg-white/80 backdrop-blur-md md:sticky md:top-auto md:bg-transparent md:backdrop-blur-none transition-all">
                {/* Pass handleSearch to Hero -> HeroSearch */}
                <Hero onSearch={handleSearch} />
            </div>

            <AutoScroll />

            {/* Product Grid Section */}
            <section
                suppressHydrationWarning
                className="w-full max-w-[1920px] mx-auto px-6 md:px-12 relative z-20 -mt-20 mt-16 md:mt-28 bg-white rounded-t-3xl pt-8"
            >
                <div
                    suppressHydrationWarning
                    className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 md:mb-12"
                >
                    <div className="mt-12 md:mt-0">
                        <h3 className="text-2xl md:text-4xl font-serif font-bold text-neutral-900 mb-2">Featured Properties</h3>
                        <p className="text-gray-600 pt-2">Handpicked PGs and flats for you.</p>
                    </div>
                    {/* Premium View All Button */}
                    <Link
                        href="/properties"
                        className="hidden md:inline-flex bg-black text-white px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-lg"
                    >
                        View All Properties
                    </Link>
                </div>

                {filteredProducts.length > 0 ? (
                    <div className="flex flex-col gap-y-10 p-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-x-8 md:gap-y-12">
                        {filteredProducts.map((product: any, index: number) => (
                            <LatestProductCard
                                key={product.id}
                                product={product}
                                labelPosition={getLabelPosition(index)}
                                className="w-full"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[30vh] gap-4">
                        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center text-3xl">
                            🔍
                        </div>
                        <p className="text-xl font-medium text-neutral-900">No properties found</p>
                        <p className="text-neutral-500">Try searching for a different city or area.</p>
                        <button
                            onClick={() => {
                                setFilteredProducts(initialProducts);
                                // Optional: You might want to clear the search input here too, but that requires lifting state up further or using Context/EventBus. 
                                // For now, just resetting the list is good UX.
                            }}
                            className="text-black font-bold border-b border-black pb-0.5 hover:opacity-70"
                        >
                            View all properties
                        </button>
                    </div>
                )}

                <div className="mt-12 text-center md:hidden">
                    <Link
                        href="/properties"
                        className="inline-flex bg-black text-white px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-lg"
                    >
                        View All Properties
                    </Link>
                </div>
            </section>

            {/* Conditional Display: Ad Section OR Trusted By Section */}
            {adSettings?.is_active ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <AdSection ad={adSettings} />
                </div>
            ) : (
                /* Social Proof / Trusted Partners - Only shown when no active ad */
                <div className="w-full border-y border-neutral-100 bg-neutral-50/30 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="max-w-[1920px] mx-auto px-6 md:px-12 py-10">
                        <p className="text-center text-sm font-medium text-neutral-400 uppercase tracking-widest mb-8">Trusted by Students & Professionals</p>
                        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                            <span className="text-xl font-bold font-serif text-neutral-800">STUDENTS</span>
                            <span className="text-xl font-bold font-serif text-neutral-800">BACHELORS</span>
                            <span className="text-xl font-bold font-serif text-neutral-800">FAMILIES</span>
                            <span className="text-xl font-bold font-serif text-neutral-800">CORPORATES</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Newsletter / Enterprise CTA */}
            <section className="w-full bg-neutral-900 text-white overflow-hidden rounded-none md:rounded-3xl mx-auto max-w-[1920px]">
                <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[400px]">
                    <div className="p-12 md:p-24 flex flex-col justify-center gap-8">
                        <h2 className="text-4xl md:text-5xl font-serif font-medium">Get Instant WhatsApp Alerts</h2>
                        <p className="text-neutral-400 text-lg max-w-md">
                            Join our WhatsApp community to get notified about new PGs and flats in Mandsaur before anyone else!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 max-w-md">
                            <Link
                                href="https://chat.whatsapp.com/EU9XWi6BWilIrRGnkPB7eJ"
                                target="_blank"
                                className="flex-1 bg-[#25D366] text-white px-8 py-4 rounded-full font-bold uppercase tracking-wide hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-3"
                            >
                                <MessageCircle className="w-6 h-6 fill-current" />
                                Join WhatsApp Group
                            </Link>
                        </div>
                        <p className="text-xs text-neutral-600">
                            Join 500+ members receiving daily updates.
                        </p>
                    </div>
                    <div className="relative bg-neutral-800 hidden lg:block">
                        {/* Abstract Pattern or Image would go here */}
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-neutral-900 to-neutral-900" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="font-serif text-9xl opacity-5 font-black tracking-tighter">NBF</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
