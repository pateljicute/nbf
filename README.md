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
- Backend API running (default: http://localhost:4000)

### Installation

```bash
npm install
# or
pnpm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
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
│   ├── types.ts          # TypeScript types
│   ├── utils.ts          # Helper functions
│   └── constants.ts      # App constants
└── public/               # Static assets
```

## API Integration

The frontend connects to a backend API for:
- Product data
- Collections
- Cart operations
- Checkout

See `lib/api.ts` for API endpoints.

## Backend API Expected Endpoints

```
GET    /products              - List products
GET    /products/:handle      - Get product by handle
GET    /collections           - List collections
GET    /collections/:handle   - Get collection
POST   /collections/:handle/products - Get collection products
GET    /cart/:id              - Get cart
POST   /cart                  - Create cart
POST   /cart/:id/items        - Add to cart
PUT    /cart/:id/items        - Update cart items
DELETE /cart/:id/items        - Remove from cart
```

## License

MIT
