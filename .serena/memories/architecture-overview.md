# Architecture Overview

## Tech Stack
- **Framework**: Next.js 15.2.4 (App Router)
- **Language**: TypeScript 5
- **UI**: React 19
- **Styling**: Tailwind CSS 4.1.13
- **State**: React Context (Cart)
- **API**: Shopify Storefront GraphQL
- **Deployment**: Vercel (auto-synced from v0.app)

## Project Structure
```
/app                    # Next.js App Router pages
  /product/[handle]     # Dynamic product pages
  /shop                 # Shop listing & filters
  page.tsx              # Home page
  layout.tsx            # Root layout

/components             # Shared components
  /ui                   # 57 Radix UI components
  /cart                 # Cart context & modal
  /layout               # Header, footer, sidebar
  /products             # Product cards & variants
  /icons                # Icon components

/lib                    # Business logic
  /shopify              # Shopify API integration
  utils.ts              # Utilities
  actions.ts            # Server actions
  constants.ts          # Constants
```

## Key Dependencies
- @radix-ui/* - UI primitives
- react-hook-form + zod - Form validation
- next-themes - Dark mode
- lucide-react - Icons
- @vercel/analytics - Analytics
- tailwindcss-animate - Animations
