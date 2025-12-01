# Technical Architecture

## Overview

OMG Store implements a modern, scalable architecture built on Next.js 15.2.4 with the App Router, focusing on performance, developer experience, and maintainability. The architecture follows React Server Components best practices and integrates seamlessly with Shopify's Storefront API.

## Architecture Principles

### 🎯 **Server/Client Separation**
- **Server Components**: Handle data fetching, SEO-critical content, and initial rendering
- **Client Components**: Manage interactive features, form handling, and user interactions
- **Clear Boundaries**: Explicit separation using `use client` directive and server action patterns

### 🏗️ **Component Hierarchy**
```
RootLayout (Server)
├── Header (Server)
├── ProductsProvider (Server/Client)
├── CartProvider (Client)
├── Main Content (Dynamic)
│   ├── ProductPages (Server)
│   ├── ShopPages (Server/Client)
│   └── CollectionPages (Server)
└── Footer (Server)
```

### 🔄 **Data Flow Architecture**

#### **1. Server-Side Data Fetching**
```typescript
// Server Component: Pre-renders with Shopify data
export default async function ProductPage({ 
  params 
}: { 
  params: { handle: string } 
}) {
  const product = await getProduct(params.handle);
  return <ProductDetails product={product} />;
}
```

#### **2. Client-Side State Management**
```typescript
// Client Component: Manages cart state
export function CartProvider({ children }) {
  const [cart, setCart] = useState<Cart | null>(null);
  // Cart operations via server actions
}
```

#### **3. Server Actions for Mutations**
```typescript
// Server Action: Secure cart operations
export async function addToCart(
  formData: FormData
): Promise<Cart> {
  'use server';
  const cartId = formData.get('cartId');
  const variantId = formData.get('variantId');
  const quantity = parseInt(formData.get('quantity'));
  
  return await addCartLines(cartId, [{
    merchandiseId: variantId,
    quantity
  }]);
}
```

## Core Architecture Patterns

### 🏢 **Context Providers Architecture**

#### **CartContext** (`/components/cart/cart-context.tsx`)
- **Purpose**: Manages global cart state across the application
- **Features**: Optimistic updates, persistent storage, server sync
- **Integration**: Works with Shopify cart API via server actions

```typescript
interface CartContextType {
  cart: ShopifyCart | null;
  addToCart: (variantId: string, quantity: number) => Promise<void>;
  updateCartItem: (lineId: string, quantity: number) => Promise<void>;
  removeFromCart: (lineId: string) => Promise<void>;
}
```

#### **ProductsContext** (`/app/shop/providers/products-provider.tsx`)
- **Purpose**: Manages product filtering, sorting, and search state
- **Features**: URL state management, filter persistence, search functionality
- **Integration**: Syncs with URL parameters and Shopify queries

### 🪝 **Custom Hooks Architecture**

#### **State Management Hooks**
```typescript
// use-available-colors.tsx
export function useAvailableColors(products: ShopifyProduct[]) {
  return useMemo(() => {
    const colorMap = new Map<string, number>();
    products.forEach(product => {
      product.variants?.edges.forEach(({ node }) => {
        const colorOption = node.selectedOptions.find(
          option => option.name.toLowerCase() === 'color'
        );
        if (colorOption) {
          colorMap.set(colorOption.value, 
            (colorMap.get(colorOption.value) || 0) + 1
          );
        }
      });
    });
    return Array.from(colorMap.entries());
  }, [products]);
}
```

#### **Utility Hooks**
```typescript
// use-mobile.tsx
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);
  
  return isMobile;
}
```

### 🏪 **Shopify Integration Layer**

#### **API Client Architecture** (`/lib/shopify/shopify.ts`)
- **Tokenless Integration**: Uses public Storefront API without private keys
- **Type Safety**: Comprehensive TypeScript definitions
- **Error Handling**: Robust error handling with user-friendly messages
- **Caching Strategy**: Smart caching with cache tags and revalidation

```typescript
// Core API structure
export interface ShopifyAPI {
  getProducts(options: ProductQueryOptions): Promise<ShopifyProduct[]>;
  getProduct(handle: string): Promise<ShopifyProduct | null>;
  getCollections(limit?: number): Promise<ShopifyCollection[]>;
  getCollectionProducts(options: CollectionProductOptions): Promise<ShopifyProduct[]>;
  createCart(): Promise<ShopifyCart>;
  addCartLines(cartId: string, lines: CartLineInput[]): Promise<ShopifyCart>;
  updateCartLines(cartId: string, lines: CartLineUpdateInput[]): Promise<ShopifyCart>;
  removeCartLines(cartId: string, lineIds: string[]): Promise<ShopifyCart>;
  getCart(cartId: string): Promise<ShopifyCart | null>;
}
```

#### **Data Transformation Layer**
- **Type Adaptors**: Transform Shopify types to application types
- **Response Normalization**: Standardize API responses
- **Error Mapping**: Convert API errors to user-friendly messages

### 📱 **Responsive Architecture**

#### **Mobile-First Design**
```typescript
// Responsive breakpoints
const breakpoints = {
  sm: '640px',
  md: '768px', 
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// Component composition
export function ProductGrid({ products }) {
  return (
    <div className="
      grid grid-cols-1 
      sm:grid-cols-2 
      md:grid-cols-3 
      lg:grid-cols-4 
      gap-4 md:gap-6
    ">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

#### **Progressive Enhancement**
- **Base Experience**: Works without JavaScript
- **Enhanced Experience**: Rich interactions with JavaScript
- **Graceful Degradation**: Features degrade gracefully

## State Management Architecture

### 🗄️ **Global State**
```typescript
// Global state hierarchy
interface AppState {
  cart: {
    cart: ShopifyCart | null;
    isLoading: boolean;
    error: string | null;
  };
  products: {
    filters: ProductFilters;
    sort: SortOption;
    searchQuery: string;
  };
  ui: {
    theme: 'light' | 'dark';
    isMobileMenuOpen: boolean;
    activeFilters: string[];
  };
}
```

### 💾 **Persistent Storage**
- **Cart Persistence**: LocalStorage for cart state
- **Filter Persistence**: URL parameters for filter state
- **Theme Preference**: LocalStorage for user preferences

### 🔄 **State Synchronization**
- **Server-Client Sync**: Real-time cart synchronization
- **URL State**: Filter and search state in URL
- **Cross-tab Sync**: Cart state across browser tabs

## Performance Architecture

### ⚡ **Optimization Strategies**

#### **Server-Side Rendering**
```typescript
// Static generation for product pages
export async function generateStaticParams() {
  const products = await getProducts({ first: 100 });
  return products.map(product => ({
    handle: product.handle,
  }));
}

// Incremental static regeneration
export const revalidate = 3600; // 1 hour
```

#### **Image Optimization**
```typescript
// Next.js Image component with Shopify CDN
import Image from 'next/image';

export function ProductImage({ product, priority = false }) {
  const image = product.images.edges[0]?.node;
  
  return (
    <Image
      src={image.url}
      alt={image.altText || product.title}
      width={400}
      height={400}
      priority={priority}
      className="object-cover w-full h-full"
    />
  );
}
```

#### **Code Splitting**
```typescript
// Dynamic imports for large components
const MobileGallerySlider = dynamic(
  () => import('./mobile-gallery-slider'),
  { 
    loading: () => <GallerySkeleton />,
    ssr: false 
  }
);
```

### 🗃️ **Caching Strategy**

#### **Data Caching**
- **Shopify API Cache**: Smart caching with cache tags
- **Static Generation**: Pre-rendered pages with ISR
- **CDN Optimization**: Asset delivery via Vercel CDN

#### **Bundle Optimization**
- **Tree Shaking**: Eliminated unused code
- **Dynamic Imports**: Lazy loading of non-critical components
- **Component Deduplication**: Shared component instances

## Security Architecture

### 🔒 **Security Measures**

#### **API Security**
```typescript
// Tokenless Shopify integration (no sensitive keys)
const SHOPIFY_STOREFRONT_API_URL = `https://${SHOPIFY_STORE_DOMAIN}/api/2025-07/graphql.json`;

// Public Storefront API (no private access required)
const response = await fetch(SHOPIFY_STOREFRONT_API_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query, variables }),
  cache: 'no-store',
});
```

#### **Server Actions Security**
```typescript
// Secure server-side operations
export async function addToCart(formData: FormData): Promise<Cart> {
  'use server';
  
  // Validate input server-side
  const variantId = formData.get('variantId');
  if (!variantId || typeof variantId !== 'string') {
    throw new Error('Invalid variant ID');
  }
  
  // Perform operation server-side
  return await addCartLines(cartId, [{ merchandiseId: variantId, quantity: 1 }]);
}
```

#### **Input Validation**
```typescript
// Zod schema validation
import { z } from 'zod';

const AddToCartSchema = z.object({
  variantId: z.string().min(1, 'Variant ID is required'),
  quantity: z.number().int().min(1).max(10),
});
```

## Development Architecture

### 🏗️ **Code Organization**

#### **File Structure Conventions**
```
/components/
├── ui/              # Base UI components (Radix UI)
├── [business]/      # Business logic components
│   ├── cart/        # Cart-specific components
│   ├── products/    # Product-specific components
│   └── layout/      # Layout components
└── [utility]/       # Utility components

/lib/
├── shopify/         # Shopify integration
├── hooks/           # Custom hooks
└── utils.ts         # General utilities

/app/
├── [route]/         # Route segments
├── layout.tsx       # Layout components
├── loading.tsx      # Loading states
└── error.tsx        # Error boundaries
```

#### **Component Design Patterns**
```typescript
// Compound component pattern
export function VariantSelector({ variants, onVariantChange }) {
  return (
    <div className="space-y-4">
      {variants.map(variant => (
        <VariantOption
          key={variant.id}
          variant={variant}
          onSelect={() => onVariantChange(variant.id)}
        />
      ))}
    </div>
  );
}

// Render props pattern
export function ProductGrid({ 
  products, 
  render: RenderComponent = ProductCard 
}) {
  return (
    <div className="grid gap-4">
      {products.map(product => (
        <RenderComponent key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### 📋 **Type Safety Architecture**

#### **Type Definitions**
```typescript
// Core Shopify types
export interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
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
  variants: {
    edges: Array<{
      node: ShopifyVariant;
    }>;
  };
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
}

// Application types
export interface Product {
  id: string;
  title: string;
  description: string;
  handle: string;
  images: ProductImage[];
  variants: ProductVariant[];
  price: Money;
  available: boolean;
}
```

This architecture provides a solid foundation for building scalable e-commerce applications while maintaining excellent developer experience and user performance.