# Development Guidelines

## Overview

This guide provides comprehensive development standards, best practices, and patterns for contributing to the OMG Store project. Following these guidelines ensures code quality, maintainability, and consistency across the codebase.

## Development Standards

### 🎯 **Code Quality Principles**

#### **1. TypeScript First**
- Use TypeScript for all new code
- Define proper types for all props, state, and return values
- Leverage strict TypeScript configuration
- Avoid `any` types unless absolutely necessary

```typescript
// Good: Proper TypeScript usage
interface ProductCardProps {
  product: ShopifyProduct;
  variant?: 'default' | 'featured';
  showQuickAdd?: boolean;
}

export function ProductCard({ 
  product, 
  variant = 'default',
  showQuickAdd = true 
}: ProductCardProps) {
  // Implementation
}

// Avoid: Using any types
export function ProductCard({ product }: { product: any }) {
  // This loses type safety
}
```

#### **2. Component Design Patterns**

**Functional Components with Hooks**
```typescript
'use client';

import { useState, useEffect } from 'react';

export function ComponentName({ prop1, prop2 }: ComponentProps) {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Side effects
  }, [dependency]);
  
  return (
    <div className="component-styles">
      {/* JSX */}
    </div>
  );
}
```

**Compound Components**
```typescript
// Parent component
export function Select({ children, value, onValueChange }) {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      {children}
    </SelectContext.Provider>
  );
}

// Child components
Select.Trigger = function SelectTrigger({ children, ...props }) {
  const context = useContext(SelectContext);
  return (
    <button onClick={context.onValueChange} {...props}>
      {children}
    </button>
  );
};

Select.Content = function SelectContent({ children }) {
  return <div className="select-content">{children}</div>;
};
```

**Render Props Pattern**
```typescript
interface DataRendererProps<T> {
  data: T[];
  render: (item: T) => React.ReactNode;
  loading?: React.ReactNode;
  error?: React.ReactNode;
}

export function DataRenderer<T>({ 
  data, 
  render, 
  loading = <LoadingSpinner />,
  error = <ErrorMessage />
}: DataRendererProps<T>) {
  if (data.length === 0) return loading;
  return <>{data.map(render)}</>;
}

// Usage
<ProductList
  products={products}
  render={(product) => (
    <ProductCard key={product.id} product={product} />
  )}
/>
```

#### **3. State Management Patterns**

**Context for Global State**
```typescript
// lib/context/global-context.tsx
'use client';

interface GlobalState {
  user: User | null;
  cart: ShopifyCart | null;
  theme: 'light' | 'dark';
}

interface GlobalContextType extends GlobalState {
  setUser: (user: User | null) => void;
  setCart: (cart: ShopifyCart | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(globalReducer, initialState);
  
  const contextValue: GlobalContextType = {
    ...state,
    setUser: (user) => dispatch({ type: 'SET_USER', payload: user }),
    setCart: (cart) => dispatch({ type: 'SET_CART', payload: cart }),
    setTheme: (theme) => dispatch({ type: 'SET_THEME', payload: theme }),
  };
  
  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobal() {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
}
```

**URL State with SearchParams**
```typescript
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export function useUrlState() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const updateParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === null || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    
    router.push(`?${params.toString()}`);
  }, [searchParams, router]);
  
  return { updateParam };
}

// Usage in components
export function ProductFilters() {
  const { updateParam } = useUrlState();
  const searchParams = useSearchParams();
  
  const handleCategoryChange = (category: string) => {
    updateParam('category', category);
  };
  
  return (
    <select
      value={searchParams.get('category') || ''}
      onChange={(e) => handleCategoryChange(e.target.value)}
    >
      <option value="">All Categories</option>
      {/* Options */}
    </select>
  );
}
```

#### **4. Performance Patterns**

**React.memo for Expensive Components**
```typescript
interface ExpensiveComponentProps {
  data: ComplexDataType;
  onUpdate: (data: ComplexDataType) => void;
}

const ExpensiveComponent = React.memo<ExpensiveComponentProps>(
  function ExpensiveComponent({ data, onUpdate }) {
    // Expensive rendering logic
    const processedData = useMemo(() => {
      return processComplexData(data);
    }, [data]);
    
    return <div>{/* Complex rendering */}</div>;
  }
);
```

**useMemo for Expensive Calculations**
```typescript
export function ProductGrid({ products }) {
  const expensiveValue = useMemo(() => {
    return products
      .filter(p => p.price > 100)
      .sort((a, b) => b.price - a.price)
      .slice(0, 10);
  }, [products]);
  
  return (
    <div>
      {expensiveValue.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

**Lazy Loading with dynamic imports**
```typescript
import dynamic from 'next/dynamic';

// Dynamic import for large components
const HeavyComponent = dynamic(() => import('./heavy-component'), {
  loading: () => <LoadingSpinner />,
  ssr: false // Disable SSR for client-only components
});

// Conditional loading
const AdminPanel = dynamic(
  () => import('./admin-panel'),
  { 
    loading: () => <AdminPanelSkeleton />,
    ssr: false 
  }
);
```

### 🏗️ **File Organization Standards**

#### **Directory Structure Conventions**
```
components/
├── ui/                    # Base UI components (Radix UI)
│   ├── button.tsx        # Individual UI components
│   ├── input.tsx
│   └── index.ts          # Barrel exports
├── business/             # Business logic components
│   ├── cart/             # Cart-specific components
│   ├── products/         # Product-specific components
│   └── layout/           # Layout components
└── index.ts              # Component library exports

lib/
├── shopify/              # Shopify integration
├── hooks/                # Custom hooks
├── utils/                # Utility functions
│   ├── formatting.ts     # Specific utility categories
│   ├── validation.ts
│   └── index.ts          # Barrel exports
└── types.ts              # Shared type definitions
```

#### **Naming Conventions**

**Components**: PascalCase
```typescript
// components/cart/cart-item.tsx
export function CartItem() {}

// components/product-card/index.tsx
export function ProductCard() {}
```

**Hooks**: camelCase with 'use' prefix
```typescript
// hooks/use-mobile.ts
export function useMobile() {}

// lib/hooks/use-cart.ts
export function useCart() {}
```

**Utils**: camelCase
```typescript
// lib/utils/formatting.ts
export function formatPrice() {}

// lib/utils/validation.ts
export function validateEmail() {}
```

**Constants**: UPPER_SNAKE_CASE
```typescript
// lib/constants.ts
export const API_ENDPOINTS = {
  PRODUCTS: '/api/products',
  CART: '/api/cart',
} as const;

export const DEFAULT_PAGE_SIZE = 20;
```

#### **Import/Export Patterns**

**Barrel Exports (Recommended)**
```typescript
// components/ui/index.ts
export { Button } from './button';
export { Input } from './input';
export { Dialog } from './dialog';

// Usage
import { Button, Input, Dialog } from '@/components/ui';
```

**Named Exports (For large modules)**
```typescript
// lib/shopify/types.ts
export interface ShopifyProduct { /* ... */ }
export interface ShopifyCollection { /* ... */ }
export interface ShopifyCart { /* ... */ }

// Usage
import { ShopifyProduct, ShopifyCollection } from '@/lib/shopify/types';
```

**Default Exports (For page components)**
```typescript
// app/shop/page.tsx
export default function ShopPage() {
  return <div>{/* Component */}</div>;
}
```

### 🎨 **Styling Guidelines**

#### **Tailwind CSS Best Practices**

**Utility-First Approach**
```typescript
// Good: Use utilities
<div className="
  flex items-center justify-between 
  p-4 bg-white rounded-lg shadow-md 
  hover:shadow-lg transition-shadow
">

// Avoid: Inline styles or custom CSS
<div style={{ 
  display: 'flex', 
  alignItems: 'center',
  backgroundColor: 'white'
}}>
```

**Component-Based Styling**
```typescript
// Create reusable style patterns
const cardStyles = "bg-white rounded-lg shadow-md p-6";
const buttonStyles = "px-4 py-2 bg-primary text-white rounded hover:bg-primary/90";

export function Card({ children, className = "" }) {
  return (
    <div className={`${cardStyles} ${className}`}>
      {children}
    </div>
  );
}
```

**Responsive Design Patterns**
```typescript
// Mobile-first responsive design
<div className="
  grid grid-cols-1          // Mobile: 1 column
  sm:grid-cols-2            // Small screens: 2 columns
  md:grid-cols-3            // Medium screens: 3 columns
  lg:grid-cols-4            // Large screens: 4 columns
  gap-4                     // Base gap
  md:gap-6                  // Larger gap on medium+
">
```

**Design System Integration**
```typescript
// Use design tokens consistently
<div className="
  text-primary              // Primary brand color
  bg-secondary             // Secondary background
  border-border            // Border color
  text-muted-foreground    // Muted text color
">
```

#### **CSS Custom Properties**

```css
/* globals.css */
:root {
  /* Color System */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  
  /* Spacing System */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Typography */
  --font-family-sans: system-ui, sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
}

/* Component usage */
.component {
  padding: var(--spacing-md);
  font-size: var(--font-size-base);
  font-family: var(--font-family-sans);
}
```

### 📱 **Mobile-First Development**

#### **Responsive Breakpoints**
```typescript
// hooks/use-breakpoint.ts
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState('sm');
  
  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= 1536) setBreakpoint('2xl');
      else if (width >= 1280) setBreakpoint('xl');
      else if (width >= 1024) setBreakpoint('lg');
      else if (width >= 768) setBreakpoint('md');
      else if (width >= 640) setBreakpoint('sm');
      else setBreakpoint('xs');
    };
    
    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);
  
  return breakpoint;
}
```

#### **Touch-Friendly Interactions**
```typescript
// Ensure touch targets are at least 44px
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: 12px;
}

// Mobile-optimized gestures
export function SwipeableCard({ children, onSwipeLeft, onSwipeRight }) {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  
  const handleTouchStart = (e: TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };
  
  const handleTouchMove = (e: TouchEvent) => {
    setCurrentX(e.touches[0].clientX);
  };
  
  const handleTouchEnd = () => {
    const diff = startX - currentX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) onSwipeLeft();
      else onSwipeRight();
    }
    setStartX(0);
    setCurrentX(0);
  };
  
  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="touch-manipulation"
    >
      {children}
    </div>
  );
}
```

### 🔒 **Security Best Practices**

#### **Input Validation**
```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

export const ProductVariantSchema = z.object({
  id: z.string().min(1, 'Variant ID is required'),
  title: z.string().min(1, 'Title is required'),
  price: z.object({
    amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format'),
    currencyCode: z.string().length(3, 'Invalid currency code'),
  }),
  availableForSale: z.boolean(),
  selectedOptions: z.array(
    z.object({
      name: z.string().min(1),
      value: z.string().min(1),
    })
  ),
});

// Server action with validation
'use server';

import { ProductVariantSchema } from '@/lib/validation/schemas';

export async function addToCart(formData: FormData) {
  const variantId = formData.get('variantId');
  const quantity = parseInt(formData.get('quantity') || '1');
  
  // Validate input
  const validation = z.object({
    variantId: z.string().min(1, 'Variant ID is required'),
    quantity: z.number().int().min(1).max(10),
  }).safeParse({ variantId, quantity });
  
  if (!validation.success) {
    throw new Error('Invalid input data');
  }
  
  // Proceed with cart operation
}
```

#### **XSS Prevention**
```typescript
// Use dangerouslySetInnerHTML carefully
export function ProductDescription({ descriptionHtml }) {
  // Sanitize HTML if coming from user input
  const sanitizedHtml = DOMPurify.sanitize(descriptionHtml);
  
  return (
    <div 
      className="prose"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

// For user-generated content
export function UserComment({ comment }) {
  // Always escape user content
  return <p>{escapeHtml(comment)}</p>;
}
```

#### **CSRF Protection**
```typescript
// Server actions are protected by default in Next.js
'use server';

export async function sensitiveOperation(formData: FormData) {
  // Next.js automatically validates the request origin
  // Additional validation if needed
  
  const userId = formData.get('userId');
  const action = formData.get('action');
  
  if (!userId || !action) {
    throw new Error('Missing required fields');
  }
  
  // Proceed with operation
}
```

### 🧪 **Testing Guidelines**

#### **Unit Testing with Vitest**
```typescript
// tests/components/ProductCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductCard } from '@/components/ProductCard';

const mockProduct = {
  id: '1',
  title: 'Test Product',
  priceRange: {
    minVariantPrice: { amount: '10.00', currencyCode: 'USD' }
  },
  images: { edges: [] },
  handle: 'test-product'
};

describe('ProductCard', () => {
  it('renders product title', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });
  
  it('displays correct price', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('$10.00')).toBeInTheDocument();
  });
});
```

#### **Integration Testing**
```typescript
// tests/integration/cart.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartProvider } from '@/components/cart/cart-context';

describe('Cart Integration', () => {
  it('adds items to cart', async () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );
    
    const addButton = screen.getByText('Add to Cart');
    fireEvent.click(addButton);
    
    // Test cart state changes
    await screen.findByText('Added to Cart');
  });
});
```

### 🚀 **Performance Guidelines**

#### **Bundle Optimization**
```typescript
// Use dynamic imports for large dependencies
import dynamic from 'next/dynamic';

// Heavy analytics library
const Analytics = dynamic(() => import('@/components/Analytics'), {
  ssr: false,
  loading: () => <AnalyticsSkeleton />
});

// Chart library only on dashboard
const Charts = dynamic(() => import('react-charts'), {
  ssr: false
});
```

#### **Image Optimization**
```typescript
// Always use Next.js Image component
import Image from 'next/image';

export function ProductImage({ product, priority = false }) {
  const image = product.images.edges[0]?.node;
  
  if (!image) return null;
  
  return (
    <Image
      src={image.url}
      alt={image.altText || product.title}
      width={400}
      height={400}
      priority={priority}
      className="object-cover w-full h-full"
      placeholder="blur"
      blurDataURL={image.thumbhash || undefined}
    />
  );
}
```

#### **Code Splitting**
```typescript
// Route-based code splitting (automatic with Next.js)
// Component-based splitting
const AdminPanel = dynamic(() => import('./admin-panel'), {
  loading: () => <AdminPanelSkeleton />
});

const ProductGallery = dynamic(() => import('./product-gallery'), {
  loading: () => <GallerySkeleton />
});
```

### 🐛 **Debugging and Development Tools**

#### **Debug Components**
```typescript
// Development-only debug components
import { isDevelopment } from '@/lib/constants';

export function DebugGrid() {
  if (!isDevelopment) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className="h-full w-full" style={{
        backgroundImage: `
          linear-gradient(rgba(255,0,0,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,0,0,0.1) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px'
      }} />
    </div>
  );
}

// Environment-specific logging
export function debugLog(message: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG]: ${message}`, data);
  }
}
```

#### **Error Boundaries**
```typescript
// Error boundary for component failures
'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ComponentErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 📊 **Analytics and Monitoring**

#### **Performance Monitoring**
```typescript
// lib/analytics/performance.ts
export function measurePerformance(name: string, fn: () => void | Promise<void>) {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const end = performance.now();
        console.log(`${name} took ${end - start} milliseconds`);
      });
    } else {
      const end = performance.now();
      console.log(`${name} took ${end - start} milliseconds`);
    }
  }
  
  return fn();
}

// Usage
export async function ExpensiveComponent() {
  return measurePerformance('ExpensiveComponent', async () => {
    // Expensive operation
    const data = await fetchExpensiveData();
    return data;
  });
}
```

#### **Error Tracking**
```typescript
// lib/error-tracking.ts
export class ErrorTracker {
  static trackError(error: Error, context?: Record<string, any>) {
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
      console.error('Tracked error:', error, context);
    } else {
      // Log locally in development
      console.error('Development error:', error, context);
    }
  }
  
  static trackUserAction(action: string, properties?: Record<string, any>) {
    if (process.env.NODE_ENV === 'production') {
      // Send to analytics service
      console.log('User action:', action, properties);
    }
  }
}

// Usage
try {
  // Risky operation
} catch (error) {
  ErrorTracker.trackError(error, { component: 'ProductCard' });
}
```

### 🔧 **Development Workflow**

#### **Git Commit Standards**
```bash
# Feature additions
feat: add new product filtering functionality

# Bug fixes
fix: resolve cart total calculation error

# Documentation updates
docs: update component usage examples

# Performance improvements
perf: optimize product image loading

# Code refactoring
refactor: extract common button styles to design system

# Testing
test: add unit tests for cart operations
```

#### **Code Review Checklist**

**Functionality**
- [ ] Code works as intended
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] Performance is considered

**Code Quality**
- [ ] TypeScript types are correct and comprehensive
- [ ] Code follows project conventions
- [ ] No unused imports or variables
- [ ] Appropriate comments and documentation

**User Experience**
- [ ] Mobile responsiveness verified
- [ ] Loading states implemented
- [ ] Error states handled gracefully
- [ ] Accessibility considerations met

**Security**
- [ ] Input validation implemented
- [ ] No XSS vulnerabilities
- [ ] Sensitive data handled properly
- [ ] CSRF protection considered

#### **Pre-commit Hooks**
```json
// .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Type checking
pnpm run type-check

# Linting
pnpm run lint

# Format code
pnpm run format

# Run tests
pnpm run test
```

### 📋 **Development Checklist**

Before submitting a pull request, ensure:

- [ ] **Code Quality**
  - All TypeScript types are properly defined
  - No console.log statements in production code
  - Code follows established patterns and conventions
  - Performance implications are considered

- [ ] **Testing**
  - Unit tests pass
  - Integration tests cover critical paths
  - Manual testing on mobile devices completed

- [ ] **Accessibility**
  - ARIA labels are present where needed
  - Keyboard navigation works properly
  - Color contrast meets WCAG guidelines
  - Screen reader compatibility verified

- [ ] **Performance**
  - Bundle size impact assessed
  - Image optimization implemented
  - Loading states for async operations
  - Proper code splitting applied

- [ ] **Documentation**
  - Components have clear prop interfaces
  - Complex logic is documented
  - Breaking changes are documented
  - README updated if needed

- [ ] **Security**
  - Input validation implemented
  - XSS prevention measures in place
  - Sensitive data not exposed
  - Authentication/authorization considered

This comprehensive development guide ensures that all contributions to the OMG Store project maintain high standards of quality, performance, and maintainability while providing an excellent developer experience.