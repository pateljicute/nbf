import { PageLayout } from '@/components/layout/page-layout';
import { LatestProductCard } from '@/components/products/latest-product-card';
import { Badge } from '@/components/ui/badge';
import { getProducts } from '@/lib/api';
import { getLabelPosition } from '../lib/utils';
import { Product } from '../lib/types';
import { Hero } from '@/components/hero';

import Link from 'next/link';

// Cache for 5 minutes to reduce Vercel bandwidth
export const revalidate = 300;

export default async function Home() {
  let featuredProducts: Product[] = [];

  try {
    // Limit to 12 products for better performance
    const allProducts = await getProducts({ limit: 12 });
    featuredProducts = allProducts;
  } catch (error) {
    console.error('Error fetching featured products:', error);
    featuredProducts = [];
  }

  return (
    <PageLayout>
      <div className="flex flex-col gap-24 pb-24">
        {/* Hero Section */}
        <Hero />

        {/* Brand Philosophy Section */}
        <section className="max-w-[1920px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
            <div className="md:col-span-4">
              <h2 className="text-4xl md:text-5xl font-serif font-medium leading-tight text-neutral-900">
                Find your place to call <span className="italic text-neutral-500">home.</span>
              </h2>
            </div>
            <div className="md:col-span-8 md:pl-12 flex flex-col gap-6">
              <p className="text-xl text-neutral-600 font-light leading-relaxed">
                Discover verified PGs, shared flats, and premium rooms. Connect directly with owners, zero brokerage, completely free. We make finding your next home simple and transparent.
              </p>
              <div className="flex gap-8 pt-4">
                <div className="flex flex-col gap-2">
                  <span className="text-3xl font-bold text-neutral-900">10k+</span>
                  <span className="text-sm text-neutral-500 uppercase tracking-wider">Active Listings</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-3xl font-bold text-neutral-900">0%</span>
                  <span className="text-sm text-neutral-500 uppercase tracking-wider">Brokerage Fee</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Grid Section */}
        <section className="w-full max-w-[1920px] mx-auto px-6 md:px-12">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h3 className="text-2xl font-serif font-bold text-neutral-900 mb-2">Featured Properties</h3>
              <p className="text-neutral-500">Handpicked PGs and flats for you.</p>
            </div>
            <Link href="/shop" className="hidden md:block text-sm font-bold uppercase tracking-widest border-b border-black pb-1 hover:text-neutral-600 hover:border-neutral-400 transition-colors">
              View All Properties
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
              {featuredProducts.map((product: any, index: number) => (
                <LatestProductCard
                  key={product.id}
                  product={product}
                  labelPosition={getLabelPosition(index)}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[20vh]">
              <p className="text-xl text-neutral-500">No properties found.</p>
            </div>
          )}

          <div className="mt-12 text-center md:hidden">
            <Link href="/shop" className="text-sm font-bold uppercase tracking-widest border-b border-black pb-1">
              View All Properties
            </Link>
          </div>
        </section>

        {/* Social Proof / Trusted Partners */}
        <div className="w-full border-y border-neutral-100 bg-neutral-50/30">
          <div className="max-w-[1920px] mx-auto px-6 md:px-12 py-12">
            <p className="text-center text-sm font-medium text-neutral-400 uppercase tracking-widest mb-8">Trusted by Students & Professionals</p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              <span className="text-xl font-bold font-serif text-neutral-800">STUDENTS</span>
              <span className="text-xl font-bold font-serif text-neutral-800">BACHELORS</span>
              <span className="text-xl font-bold font-serif text-neutral-800">FAMILIES</span>
              <span className="text-xl font-bold font-serif text-neutral-800">CORPORATES</span>
            </div>
          </div>
        </div>

        {/* Newsletter / Enterprise CTA */}
        <section className="w-full bg-neutral-900 text-white overflow-hidden rounded-none md:rounded-3xl mx-auto max-w-[1920px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[400px]">
            <div className="p-12 md:p-24 flex flex-col justify-center gap-8">
              <h2 className="text-4xl md:text-5xl font-serif font-medium">Get Property Alerts</h2>
              <p className="text-neutral-400 text-lg max-w-md">
                Subscribe to receive notifications about new PGs and flats in your preferred area before anyone else.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-white/10 border border-white/20 rounded-full px-6 py-4 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                />
                <button className="bg-white text-black px-8 py-4 rounded-full font-bold uppercase tracking-wide hover:bg-neutral-200 transition-colors">
                  Subscribe
                </button>
              </div>
              <p className="text-xs text-neutral-600">
                By subscribing you agree to our Terms & Conditions and Privacy Policy.
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
    </PageLayout>
  );
}
