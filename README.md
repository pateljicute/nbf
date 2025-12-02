# E-commerce Frontend

A modern Next.js 15 e-commerce frontend with backend API integration.

## Tech Stack

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Radix UI** - Accessible components
- **shadcn/ui** - Component library

## Features

- Product catalog with filtering and sorting
- Collection-based navigation
- Shopping cart with local state management
- Product variants (size, color, etc.)
- Responsive design
- Server-side rendering for SEO

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Supabase Project (credentials required)

### Installation

```bash
npm install
# or
pnpm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# Optional: Override API URL (defaults to internal /api)
# NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── api/               # Internal API Routes (Backend Logic)
│   ├── page.tsx           # Home page
│   ├── shop/              # Shop pages
│   └── product/           # Product detail pages
├── components/            # React components
│   ├── cart/             # Cart components
│   ├── layout/           # Layout components
│   ├── products/         # Product components
│   └── ui/               # UI components (shadcn)
├── lib/                   # Utilities and API
│   ├── api.ts            # Backend API calls
│   ├── db.ts             # Supabase client
│   ├── backend-utils.ts  # Backend helpers
│   ├── types.ts          # TypeScript types
│   ├── utils.ts          # Helper functions
│   └── constants.ts      # App constants
└── public/               # Static assets
```

## API Integration

The frontend uses internal Next.js API Routes (`app/api`) which connect to Supabase.
See `lib/api.ts` for client-side API calls and `app/api` for the backend implementation.

## API Endpoints

The internal API routes mirror the previous external backend structure:

```
GET    /api/products              - List products
GET    /api/products/:handle      - Get product by handle
GET    /api/collections           - List collections
GET    /api/collections/:handle   - Get collection
POST   /api/collections/:handle/products - Get collection products
GET    /api/cart/:id              - Get cart
POST   /api/cart                  - Create cart
POST   /api/cart/:id/items        - Add to cart
PUT    /api/cart/:id/items        - Update cart items
DELETE /api/cart/:id/items        - Remove from cart
```

## License

MIT
