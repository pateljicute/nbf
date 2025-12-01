# Data Flow Patterns

## Product Data Flow

### Fetching Products
1. Server component calls `getProducts()` or `getProduct()`
2. Shopify API returns GraphQL response
3. Adapter functions transform raw data
4. Type-safe Product/Collection returned
5. Passed to client components as props
6. Rendered with loading states (Suspense)

### Product Display
- Server-side rendering (SSR)
- Static generation (SSG) for product pages
- ISR with 60s revalidation
- Skeleton loaders during fetch

## Cart Data Flow

### Adding to Cart
1. User clicks "Add to Cart"
2. Client component calls `addToCart()` from context
3. Context dispatches ADD action
4. Reducer updates local state optimistically
5. Server action `addToCart()` called
6. Shopify API creates/updates cart
7. Cart ID stored in cookie
8. UI updates with new cart state

### Cart State Management
1. CartProvider wraps app in layout
2. useReducer manages cart state
3. Cookie persists cart ID across sessions
4. Server actions sync with Shopify
5. Context provides cart to all components

### Cart Operations
- **Add**: Dispatch ADD → Server action → API call
- **Update**: Dispatch UPDATE → Server action → API call
- **Remove**: Dispatch REMOVE → Server action → API call
- **Load**: Read cookie → Fetch cart → Dispatch SET

## Filter/Search Flow

### Shop Filters
1. User selects filter (category/color)
2. URL params updated (nuqs)
3. Server component re-renders
4. Products filtered server-side
5. New product list rendered

### Available Colors
1. Products fetched
2. Custom hook `useAvailableColors()` extracts colors
3. Color filter populated dynamically
4. Only available colors shown

## Server Actions Pattern
```typescript
'use server'
async function serverAction() {
  // 1. Get data from cookies
  // 2. Call Shopify API
  // 3. Update cookies if needed
  // 4. Return result
  // 5. Revalidate paths if needed
}
```

## Performance Optimizations
- Server components for data fetching
- Client components only when needed
- Suspense boundaries for loading
- Static generation where possible
- Incremental static regeneration
- Image optimization (Next.js Image)
- Code splitting with dynamic imports
