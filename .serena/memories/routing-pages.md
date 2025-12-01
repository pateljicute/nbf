# Routing & Pages

## Routing Strategy
- Next.js 15 App Router
- Server Components by default
- Client Components marked with 'use client'
- Dynamic routes with static generation

## Pages

### Home Page (`app/page.tsx`)
- Displays featured products from first collection
- Grid layout with "latest drop" badge
- Responsive design
- Fallback to all products if no collections
- Server component with data fetching

### Shop Pages (`app/shop/`)
- **Main**: `page.tsx` - Product listing
- **Collection**: `[collection]/page.tsx` - Collection-specific
- **Components**: Filters, product cards, sorting
- **Hooks**: useFilters, useAvailableColors
- **Providers**: ProductsProvider for context

Features:
- Category filtering
- Color filtering
- Sorting options
- Mobile-responsive filters
- Skeleton loading states
- Revalidation: 60 seconds

### Product Pages (`app/product/[handle]/`)
- **Main**: `page.tsx` - Product detail
- **Components**: Gallery, variant selector
- Dynamic routing by product handle
- Static params generation for SSG
- SEO metadata generation
- Desktop gallery & mobile slider
- Variant selection (size, color, etc.)
- Add to cart functionality

### Layout (`app/layout.tsx`)
- Root layout with fonts (Geist Sans/Mono)
- Theme provider (dark mode)
- Cart provider
- Metadata configuration
- Analytics integration

### Error Pages
- `error.tsx` - Error boundary
- `not-found.tsx` - 404 page

## Static Generation
- Product pages pre-generated
- `generateStaticParams()` for products
- ISR with 60s revalidation
- Suspense boundaries for loading
