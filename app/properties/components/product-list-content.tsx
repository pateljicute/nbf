'use client';

import { useEffect, useMemo, useState } from 'react';
import { Product, Collection } from '@/lib/types';
import { ProductCard } from './product-card';
import { Search } from 'lucide-react';

import { useProducts } from '../providers/products-provider';
import { useQueryState, parseAsArrayOf, parseAsString } from 'nuqs';
import { ProductGrid } from './product-grid';
import { Card } from '../../../components/ui/card';
import { PriceFilter } from '@/components/shop/price-filter';
import { SearchBar } from '@/components/shop/search-bar';

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
      {/* Search Bar - New */}
      <SearchBar />

      {/* Price Filter - Moved to Top */}
      <PriceFilter />

      {filteredProducts.length > 0 ? (
        // Enforce single column on mobile (grid-cols-1) with !important override
        <ProductGrid className="grid-cols-1 gap-4 w-full md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ProductGrid>
      ) : (
        <div className="w-full bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
              <span className="text-xl">🔍</span>
            </div>
            <div>
              <p className="text-neutral-900 font-medium">No properties match your filters.</p>
              <p className="text-sm text-neutral-500 mt-1">Try adjusting the price range or filters.</p>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}
