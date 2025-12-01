# API Integration

## Overview

OMG Store integrates with Shopify's Storefront API to provide a complete e-commerce experience. The integration uses a tokenless approach, leveraging Shopify's public Storefront API which doesn't require private API keys, making it secure and easy to deploy.

## Shopify Integration Architecture

### 🔧 **Core Integration Layer**

The Shopify integration is implemented in `/lib/shopify/` directory with the following structure:

```
lib/shopify/
├── shopify.ts              # Core API client
├── types.ts               # TypeScript definitions
├── constants.ts           # API constants
├── utils.ts               # Utility functions
├── parse-shopify-domain.ts # Domain parsing
└── store-name.ts          # Store configuration
```

### 🔑 **Tokenless Authentication**

The integration uses Shopify's public Storefront API, eliminating the need for sensitive API keys:

```typescript
// Core API configuration
const rawStoreDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const fallbackStoreDomain = 'v0-template.myshopify.com';
const SHOPIFY_STORE_DOMAIN = rawStoreDomain ? parseShopifyDomain(rawStoreDomain) : fallbackStoreDomain;

const SHOPIFY_STOREFRONT_API_URL = `https://${SHOPIFY_STORE_DOMAIN}/api/2025-07/graphql.json`;

// Tokenless API request
async function shopifyFetch<T>({
  query,
  variables = {},
}: {
  query: string;
  variables?: Record<string, any>;
}): Promise<{ data: T; errors?: any[] }> {
  try {
    const response = await fetch(SHOPIFY_STOREFRONT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      cache: 'no-store', // Ensure fresh data for cart operations
    });
    
    // Handle response and errors
    // ... (error handling code)
  } catch (error) {
    console.error('Shopify fetch error:', error);
    throw error;
  }
}
```

## API Operations

### 📦 **Product Operations**

#### Get All Products
```typescript
export async function getProducts({
  first = DEFAULT_PAGE_SIZE,
  sortKey = DEFAULT_SORT_KEY,
  reverse = false,
  query: searchQuery,
}: {
  first?: number;
  sortKey?: ProductSortKey;
  reverse?: boolean;
  query?: string;
}): Promise<ShopifyProduct[]>
```

**GraphQL Query:**
```graphql
query getProducts($first: Int!, $sortKey: ProductSortKeys!, $reverse: Boolean) {
  products(first: $first, sortKey: $sortKey, reverse: $reverse) {
    edges {
      node {
        id
        title
        description
        descriptionHtml
        handle
        productType
        options {
          id
          name
          values
        }
        images(first: 5) {
          edges {
            node {
              url
              altText
              thumbhash
            }
          }
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        compareAtPriceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        variants(first: 10) {
          edges {
            node {
              id
              title
              price {
                amount
                currencyCode
              }
              availableForSale
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
    }
  }
}
```

**Usage Example:**
```typescript
// Get all products with default settings
const products = await getProducts();

// Get products with custom sorting and filtering
const expensiveProducts = await getProducts({
  first: 20,
  sortKey: 'PRICE',
  reverse: true,
  query: 'category:shoes'
});
```

#### Get Single Product
```typescript
export async function getProduct(handle: string): Promise<ShopifyProduct | null>
```

**GraphQL Query:**
```graphql
query getProduct($handle: String!) {
  product(handle: $handle) {
    id
    title
    description
    descriptionHtml
    handle
    productType
    category {
      id
      name
    }
    options {
      id
      name
      values
    }
    images(first: 10) {
      edges {
        node {
          url
          altText
          thumbhash
        }
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    variants(first: 10) {
      edges {
        node {
          id
          title
          price {
            amount
            currencyCode
          }
          availableForSale
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
}
```

**Usage Example:**
```typescript
const product = await getProduct('summer-dress-2024');
if (!product) {
  throw new Error('Product not found');
}
```

### 🗂️ **Collection Operations**

#### Get Collections
```typescript
export async function getCollections(first = 10): Promise<ShopifyCollection[]>
```

**GraphQL Query:**
```graphql
query getCollections($first: Int!) {
  collections(first: $first) {
    edges {
      node {
        id
        title
        handle
        description
        image {
          url
          altText
          thumbhash
        }
      }
    }
  }
}
```

#### Get Collection Products
```typescript
export async function getCollectionProducts({
  collection,
  limit = DEFAULT_PAGE_SIZE,
  sortKey = DEFAULT_SORT_KEY,
  query: searchQuery,
  reverse = false,
}: {
  collection: string;
  limit?: number;
  sortKey?: ProductCollectionSortKey;
  query?: string;
  reverse?: boolean;
}): Promise<ShopifyProduct[]>
```

### 🛒 **Cart Operations**

#### Create Cart
```typescript
export async function createCart(): Promise<ShopifyCart>
```

**GraphQL Mutation:**
```graphql
mutation cartCreate {
  cartCreate {
    cart {
      id
      lines(first: 100) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                price {
                  amount
                  currencyCode
                }
                product {
                  title
                  images(first: 1) {
                    edges {
                      node {
                        url
                        altText
                        thumbhash
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      cost {
        totalAmount {
          amount
          currencyCode
        }
      }
      checkoutUrl
    }
    userErrors {
      field
      message
    }
  }
}
```

#### Add Items to Cart
```typescript
export async function addCartLines(
  cartId: string,
  lines: Array<{ merchandiseId: string; quantity: number }>
): Promise<ShopifyCart>
```

**GraphQL Mutation:**
```graphql
mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
  cartLinesAdd(cartId: $cartId, lines: $lines) {
    cart {
      id
      lines(first: 100) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                price {
                  amount
                  currencyCode
                }
                product {
                  title
                  images(first: 1) {
                    edges {
                      node {
                        url
                        altText
                        thumbhash
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      cost {
        totalAmount {
          amount
          currencyCode
        }
      }
      checkoutUrl
    }
    userErrors {
      field
      message
    }
  }
}
```

**Usage Example:**
```typescript
const cart = await addCartLines(cartId, [
  {
    merchandiseId: 'variant-id-123',
    quantity: 2
  }
]);
```

#### Update Cart Items
```typescript
export async function updateCartLines(
  cartId: string,
  lines: Array<{ id: string; quantity: number }>
): Promise<ShopifyCart>
```

#### Remove Cart Items
```typescript
export async function removeCartLines(cartId: string, lineIds: string[]): Promise<ShopifyCart>
```

#### Get Cart
```typescript
export async function getCart(cartId: string): Promise<ShopifyCart | null>
```

## Type Definitions

### Core Types

```typescript
// lib/shopify/types.ts

export interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  descriptionHtml: string;
  handle: string;
  productType: string;
  category?: {
    id: string;
    name: string;
  };
  options: Array<{
    id: string;
    name: string;
    values: string[];
  }>;
  images: {
    edges: Array<{
      node: {
        url: string;
        altText: string | null;
        thumbhash: string | null;
      };
    }>;
  };
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  compareAtPriceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  variants: {
    edges: Array<{
      node: ShopifyVariant;
    }>;
  };
}

export interface ShopifyVariant {
  id: string;
  title: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  availableForSale: boolean;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
}

export interface ShopifyCart {
  id: string;
  lines: {
    edges: Array<{
      node: {
        id: string;
        quantity: number;
        merchandise: {
          ... on ShopifyVariant {
            id: string;
            title: string;
            price: {
              amount: string;
              currencyCode: string;
            };
            selectedOptions: Array<{
              name: string;
              value: string;
            }>;
            product: {
              title: string;
              handle: string;
              images: {
                edges: Array<{
                  node: {
                    url: string;
                    altText: string | null;
                    thumbhash: string | null;
                  };
                }>;
              };
            };
          };
        };
      };
    }>;
  };
  cost: {
    totalAmount: {
      amount: string;
      currencyCode: string;
    };
    subtotalAmount?: {
      amount: string;
      currencyCode: string;
    };
    totalTaxAmount?: {
      amount: string;
      currencyCode: string;
    };
  };
  checkoutUrl: string;
}

export interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  description: string;
  image?: {
    url: string;
    altText: string | null;
    thumbhash: string | null;
  };
}
```

### Query Options

```typescript
export type ProductSortKey = 
  | 'BEST_SELLING'
  | 'CREATED_AT'
  | 'ID'
  | 'PRICE'
  | 'PRODUCT_TYPE'
  | 'RELEVANCE'
  | 'TITLE'
  | 'UPDATED_AT'
  | 'VENDOR';

export type ProductCollectionSortKey = 
  | 'BEST_SELLING'
  | 'COLLECTION_DEFAULT'
  | 'CREATED'
  | 'ID'
  | 'MANUAL'
  | 'PRICE'
  | 'RELEVANCE'
  | 'TITLE';

export interface ProductQueryOptions {
  first?: number;
  sortKey?: ProductSortKey;
  reverse?: boolean;
  query?: string;
}

export interface CollectionProductOptions {
  collection: string;
  limit?: number;
  sortKey?: ProductCollectionSortKey;
  query?: string;
  reverse?: boolean;
}
```

## Server Actions Integration

### Cart Management with Server Actions

The application uses Next.js Server Actions for secure cart operations:

```typescript
// lib/actions.ts
'use server';

import { addCartLines, updateCartLines, removeCartLines } from '@/lib/shopify';
import { revalidateTag } from 'next/cache';

export async function addToCart(formData: FormData): Promise<void> {
  const cartId = formData.get('cartId');
  const variantId = formData.get('variantId');
  const quantity = parseInt(formData.get('quantity') || '1');

  if (!cartId || !variantId) {
    throw new Error('Cart ID and variant ID are required');
  }

  await addCartLines(cartId, [
    {
      merchandiseId: variantId,
      quantity
    }
  ]);

  // Revalidate relevant cache tags
  revalidateTag('cart');
}

export async function updateCartItem(formData: FormData): Promise<void> {
  const cartId = formData.get('cartId');
  const lineId = formData.get('lineId');
  const quantity = parseInt(formData.get('quantity') || '1');

  if (!cartId || !lineId) {
    throw new Error('Cart ID and line ID are required');
  }

  await updateCartLines(cartId, [
    {
      id: lineId,
      quantity
    }
  ]);

  revalidateTag('cart');
}

export async function removeFromCart(formData: FormData): Promise<void> {
  const cartId = formData.get('cartId');
  const lineId = formData.get('lineId');

  if (!cartId || !lineId) {
    throw new Error('Cart ID and line ID are required');
  }

  await removeCartLines(cartId, [lineId]);
  revalidateTag('cart');
}
```

### Client-Side Cart Integration

```typescript
// components/cart/cart-context.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { ShopifyCart } from '@/lib/shopify/types';
import { useServerAction } from 'next/navigation';

interface CartContextType {
  cart: ShopifyCart | null;
  addToCart: (variantId: string, quantity: number) => Promise<void>;
  updateCartItem: (lineId: string, quantity: number) => Promise<void>;
  removeFromCart: (lineId: string) => Promise<void>;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<ShopifyCart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addToCart = useServerAction(addToCartAction);
  const updateCartItem = useServerAction(updateCartItemAction);
  const removeFromCart = useServerAction(removeFromCartAction);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCartId = localStorage.getItem('cartId');
    if (savedCartId) {
      loadCart(savedCartId);
    }
  }, []);

  async function addToCartAction(formData: FormData) {
    setIsLoading(true);
    try {
      await addToCart(formData);
      // Refresh cart after successful addition
      const cartId = localStorage.getItem('cartId');
      if (cartId) {
        await loadCart(cartId);
      }
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateCartItemAction(formData: FormData) {
    setIsLoading(true);
    try {
      await updateCartItem(formData);
      const cartId = localStorage.getItem('cartId');
      if (cartId) {
        await loadCart(cartId);
      }
    } catch (error) {
      console.error('Failed to update cart item:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function removeFromCartAction(formData: FormData) {
    setIsLoading(true);
    try {
      await removeFromCart(formData);
      const cartId = localStorage.getItem('cartId');
      if (cartId) {
        await loadCart(cartId);
      }
    } catch (error) {
      console.error('Failed to remove cart item:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <CartContext.Provider value={{
      cart,
      addToCart: (variantId: string, quantity: number) => {
        const formData = new FormData();
        formData.append('cartId', localStorage.getItem('cartId') || '');
        formData.append('variantId', variantId);
        formData.append('quantity', quantity.toString());
        return addToCartAction(formData);
      },
      updateCartItem: (lineId: string, quantity: number) => {
        const formData = new FormData();
        formData.append('cartId', localStorage.getItem('cartId') || '');
        formData.append('lineId', lineId);
        formData.append('quantity', quantity.toString());
        return updateCartItemAction(formData);
      },
      removeFromCart: (lineId: string) => {
        const formData = new FormData();
        formData.append('cartId', localStorage.getItem('cartId') || '');
        formData.append('lineId', lineId);
        return removeFromCartAction(formData);
      },
      isLoading
    }}>
      {children}
    </CartContext.Provider>
  );
}
```

## Error Handling

### API Error Handling

```typescript
// lib/shopify/shopify.ts
async function shopifyFetch<T>({
  query,
  variables = {},
}: {
  query: string;
  variables?: Record<string, any>;
}): Promise<{ data: T; errors?: any[] }> {
  try {
    const response = await fetch(SHOPIFY_STOREFRONT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Shopify API HTTP error! Status: ${response.status}, Body: ${errorBody}`);
    }

    const json = await response.json();

    if (json.errors) {
      console.error('Shopify API errors:', json.errors);
      throw new Error(`Shopify GraphQL errors: ${JSON.stringify(json.errors)}`);
    }

    return json;
  } catch (error) {
    console.error('Shopify fetch error:', error);
    throw error;
  }
}
```

### User-Friendly Error Messages

```typescript
// lib/utils/error-handling.ts
export function handleShopifyError(error: any): string {
  if (error.message?.includes('rate limit')) {
    return 'Too many requests. Please try again in a moment.';
  }
  
  if (error.message?.includes('not found')) {
    return 'The requested item could not be found.';
  }
  
  if (error.message?.includes('unauthorized')) {
    return 'Authentication error. Please refresh the page.';
  }
  
  return 'Something went wrong. Please try again.';
}
```

## Caching Strategy

### API Response Caching

```typescript
// Server-side caching with Next.js
export async function getProductsCached(options: ProductQueryOptions = {}) {
  const { query, ...rest } = options;
  
  // Generate cache key
  const cacheKey = `products:${JSON.stringify(rest)}:${query || ''}`;
  
  // Check cache first
  let products = await cache.get<ShopifyProduct[]>(cacheKey);
  
  if (!products) {
    // Fetch from Shopify API
    products = await getProducts(options);
    
    // Cache for 5 minutes
    await cache.set(cacheKey, products, { 
      tags: ['products'],
      ttl: 300 
    });
  }
  
  return products;
}
```

### Cache Invalidation

```typescript
// Invalidate cache when cart changes
import { revalidateTag } from 'next/cache';

export async function addCartLines(/* ... */) {
  // Update cart
  const result = await shopifyFetch(/* ... */);
  
  // Invalidate cart cache
  revalidateTag('cart');
  
  return result;
}
```

## Performance Optimization

### Image Optimization

```typescript
// lib/shopify/utils.ts
export function optimizeImageUrl(url: string, width?: number, height?: number): string {
  if (!url) return '';
  
  // Add Shopify image transformation parameters
  const params = new URLSearchParams();
  if (width) params.set('width', width.toString());
  if (height) params.set('height', height.toString());
  params.set('format', 'webp');
  params.set('quality', '80');
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${params.toString()}`;
}
```

### Batch Operations

```typescript
// lib/shopify/utils.ts
export async function batchGetProducts(productHandles: string[]): Promise<ShopifyProduct[]> {
  const batchSize = 10; // Shopify API limits
  const batches = [];
  
  for (let i = 0; i < productHandles.length; i += batchSize) {
    const batch = productHandles.slice(i, i + batchSize);
    const products = await Promise.all(
      batch.map(handle => getProduct(handle))
    );
    batches.push(...products.filter(Boolean));
  }
  
  return batches;
}
```

## Environment Configuration

### Required Environment Variables

```env
# Required
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com

# Optional
NODE_ENV=development
VERCEL_URL=your-app.vercel.app
```

### Configuration Validation

```typescript
// lib/shopify/store-name.ts
export function getStoreDomain(): string {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || 'v0-template.myshopify.com';
  
  // Validate domain format
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.myshopify\.com$/.test(domain)) {
    console.warn(`Invalid Shopify domain format: ${domain}. Using fallback.`);
    return 'v0-template.myshopify.com';
  }
  
  return domain;
}
```

This comprehensive API integration provides a robust foundation for e-commerce functionality while maintaining security, performance, and developer experience.