'use client';

import { useEffect, useMemo, useState } from 'react';
import { Product, Collection } from '@/lib/types';
import { LatestProductCard } from '@/components/products/latest-product-card';
import { Search } from 'lucide-react';

import { useProducts } from '../providers/products-provider';
import { useQueryState, parseAsArrayOf, parseAsString } from 'nuqs';
import { ProductGrid } from './product-grid';
import { Card } from '../../../components/ui/card';
import { BudgetChips } from '@/components/shop/budget-chips';

interface ProductListContentProps {
  products: Product[];
  collections: Collection[];
  searchQuery?: string;
}

// Client-side filtering function (simplified, removed color logic)
function filterProducts(products: Product[]): Product[] {
  return products;
}

export function ProductListContent({ products, collections, searchQuery }: ProductListContentProps) {
  const { setProducts, setOriginalProducts } = useProducts();

  // Apply client-side filtering whenever products change (currently pass-through)
  const filteredProducts = useMemo(() => {
    return filterProducts(products);
  }, [products]);

  // Set both original and filtered products in the provider whenever they change
  useEffect(() => {
    setOriginalProducts(products);
    setProducts(filteredProducts);
  }, [products, filteredProducts, setProducts, setOriginalProducts]);

  return (
    <div className="flex flex-col gap-6">
      {/* Search Trigger - Redirects to Global Search */}
      <button
        onClick={() => {
          // Using window.location or router.push based on preference. router.push is better for SPA.
          // But we need router hook. Let's see if we can import it.
          // Wait, we can't introduce hooks here if not already imported. 
          // ProductListContent is a client component, so we can use hooks.
          // I'll assume useRouter is available or I can add it?
          // Ah, I need to check imports.
          window.location.href = '/search'; // Safe fallback or use hook if I add import
        }}
        className="w-full text-left relative group cursor-pointer"
      >
        <div className="w-full pl-11 pr-10 py-3.5 bg-white border border-neutral-200 rounded-2xl text-neutral-500 shadow-sm group-hover:border-blue-300 transition-all flex items-center">
          <span className="text-neutral-900 font-medium">
            {searchQuery ? searchQuery : "Search by City"}
          </span>
        </div>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-hover:text-blue-500">
          <Search className="w-5 h-5" />
        </div>
      </button>

      {/* Search Header */}
      {searchQuery && (
        <div className="mb-4 animate-in fade-in slide-in-from-top-4">
          <h1 className="text-xl md:text-2xl font-bold text-neutral-900">
            Showing properties in <span className="text-blue-600">"{searchQuery}"</span>
          </h1>
          <p className="text-neutral-500 text-sm mt-1">Found {filteredProducts.length} results</p>
        </div>
      )}

      {/* Dashboard Layout */}
      <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-0 md:gap-8 items-start">

        {/* Sidebar / Topbar Filter */}
        <aside className="w-full md:sticky md:top-24 z-10 bg-white/50 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none py-2 md:py-0 mb-4 md:mb-0">
          <BudgetChips />
          {/* Add more sidebar filters here if needed (Type, BHK etc) */}
        </aside>

        {/* Product Grid Area */}
        <main className="w-full min-h-[50vh]">
          {filteredProducts.length > 0 ? (
            <ProductGrid className="grid-cols-1 gap-6 w-full md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {filteredProducts.map(product => (
                <LatestProductCard key={product.id} product={product} />
              ))}
            </ProductGrid>
          ) : (
            <div className="w-full bg-white rounded-2xl p-12 border border-neutral-100 shadow-sm text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-2">
                  <Search className="w-8 h-8 text-neutral-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-2">
                    {searchQuery ? `No properties found in "${searchQuery}"` : 'No properties found'}
                  </h3>
                  <p className="text-neutral-500 max-w-md mx-auto">
                    {searchQuery
                      ? "We couldn't find any properties matching your search area. Try searching for a nearby city or a different locality."
                      : "Try adjusting your filters or search criteria."}
                  </p>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => window.location.href = '/search'}
                    className="mt-4 px-6 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 transition-all"
                  >
                    Search Another Area
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
