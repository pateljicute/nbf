# Development Setup

## Prerequisites

Before setting up the OMG Store project, ensure you have the following installed on your system:

### Required Software

| Tool | Version | Purpose | Installation |
|------|---------|---------|--------------|
| **Node.js** | 18+ | JavaScript runtime | [nodejs.org](https://nodejs.org/) |
| **pnpm** | 8+ | Package manager | `npm install -g pnpm` |
| **Git** | Latest | Version control | [git-scm.com](https://git-scm.com/) |

### Recommended Tools

| Tool | Purpose | Installation |
|------|---------|--------------|
| **VS Code** | Code editor | [code.visualstudio.com](https://code.visualstudio.com/) |
| **V0 Extension** | Design system integration | VS Code Marketplace |
| **Tailwind CSS IntelliSense** | Better Tailwind development | VS Code Extension |

## Environment Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd shop

# Install dependencies using pnpm
pnpm install

# Verify installation
pnpm --version
```

### 2. Environment Configuration

Create a `.env.local` file in the project root with the following variables:

```env
# Shopify Configuration (Optional - uses fallback if not provided)
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com

# Development Configuration
NODE_ENV=development

# Analytics (Optional)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id

# V0 Integration (Optional - for v0.app sync)
VERCEL_URL=your-app.vercel.app
```

#### Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | Your Shopify store domain | No | `v0-template.myshopify.com` |
| `NODE_ENV` | Application environment | No | `development` |
| `VERCEL_URL` | Vercel deployment URL | No | Auto-detected |

### 3. Shopify Store Configuration

#### Option A: Use Default Template Store
The project is pre-configured to work with a default Shopify template store (`v0-template.myshopify.com`). No additional setup required for basic functionality.

#### Option B: Connect Your Own Store

1. **Create a Shopify Store** (if you don't have one):
   - Visit [Shopify Partners](https://partners.shopify.com/)
   - Create a development store
   - Enable the Storefront API

2. **Configure Storefront API**:
   - Go to your store admin → Apps → Develop apps
   - Create a new app or use existing
   - Enable Storefront API access
   - Copy your store domain (without protocol)

3. **Update Environment**:
   ```env
   NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
   ```

### 4. Development Server

Start the development server:

```bash
# Start development server
pnpm dev

# The application will be available at:
# http://localhost:3000
```

### 5. Vercel Deployment (Optional)

For production deployment:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel

# Follow the prompts to link your project
```

## Project Configuration

### Package.json Scripts

| Script | Purpose | Command |
|--------|---------|---------|
| **dev** | Start development server | `pnpm dev` |
| **build** | Build for production | `pnpm build` |
| **start** | Start production server | `pnpm start` |
| **lint** | Run ESLint | `pnpm lint` |
| **type-check** | TypeScript type checking | `pnpm tsc --noEmit` |

### TypeScript Configuration

The project uses a strict TypeScript configuration. Key settings in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Tailwind CSS Configuration

The project uses Tailwind CSS v4 with PostCSS. Configuration files:

#### `tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

#### `postcss.config.js`
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### ESLint Configuration

The project uses a modern ESLint configuration with recommended plugins:

#### `.eslintrc.json`
```json
{
  "extends": [
    "next/core-web-vitals",
    "prettier"
  ],
  "rules": {
    // Add any project-specific rules
  }
}
```

## Development Workflow

### 1. File Structure Overview

```
shop/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   ├── product/           # Product pages
│   └── shop/              # Shop pages
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── cart/             # Cart components
│   ├── layout/           # Layout components
│   └── products/         # Product components
├── lib/                  # Utility libraries
│   ├── shopify/          # Shopify integration
│   ├── hooks/            # Custom hooks
│   └── utils.ts          # General utilities
└── docs/                 # Documentation
```

### 2. Development Guidelines

#### Component Development
```typescript
// Create new component
export function NewComponent({ 
  prop1, 
  prop2 
}: NewComponentProps) {
  return (
    <div className="p-4">
      {/* Component content */}
    </div>
  );
}
```

#### Adding New Pages
```typescript
// app/new-page/page.tsx
export default function NewPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page content */}
    </div>
  );
}
```

#### Working with Shopify Data
```typescript
// lib/shopify/my-query.ts
import { getProducts } from './shopify';

export async function fetchCustomData() {
  const products = await getProducts({ 
    first: 20,
    sortKey: 'CREATED_AT' 
  });
  return products;
}
```

### 3. Styling Guidelines

#### Tailwind CSS Classes
- Use utility-first approach
- Leverage design system colors and spacing
- Follow responsive design patterns

```typescript
// Good
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Avoid
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
```

#### CSS Variables
```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  /* ... more variables */
}
```

### 4. TypeScript Best Practices

#### Type Definitions
```typescript
// lib/types.ts
export interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
}

// Component props
interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'featured';
}
```

#### Server vs Client Components
```typescript
// Server Component (default)
export default async function ProductPage({ 
  params 
}: { 
  params: { handle: string } 
}) {
  const product = await getProduct(params.handle);
  return <ProductDetails product={product} />;
}

// Client Component
'use client';
export function AddToCart({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  // Client-side logic
}
```

## Testing

### Unit Testing
```bash
# Install testing dependencies
pnpm add -D @testing-library/react @testing-library/jest-dom vitest

# Run tests
pnpm test
```

### E2E Testing (Optional)
```bash
# Install Playwright
pnpm add -D @playwright/test

# Run E2E tests
pnpm exec playwright test
```

## Performance Optimization

### 1. Image Optimization
```typescript
// Use Next.js Image component
import Image from 'next/image';

export function ProductImage({ src, alt }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={400}
      priority={false}
      className="object-cover"
    />
  );
}
```

### 2. Component Optimization
```typescript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(function ExpensiveComponent({ 
  data 
}: { 
  data: any 
}) {
  return <div>{/* Expensive rendering */}</div>;
});

// Use useMemo for expensive calculations
function ProductGrid({ products }) {
  const expensiveValue = useMemo(() => {
    return products.filter(p => p.price > 100);
  }, [products]);
  
  return <div>{/* Component JSX */}</div>;
}
```

### 3. Bundle Analysis
```bash
# Analyze bundle size
pnpm build
npx @next/bundle-analyzer

# Check for unused dependencies
pnpm exec depcheck
```

## Troubleshooting

### Common Issues

#### 1. Shopify API Errors
```typescript
// Check environment variables
console.log('Shopify domain:', process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN);

// Handle API errors gracefully
try {
  const products = await getProducts();
} catch (error) {
  console.error('Shopify API error:', error);
  // Fallback to default data
}
```

#### 2. TypeScript Errors
```bash
# Clear TypeScript cache
rm -rf .next
pnpm dev

# Check specific files
pnpm tsc --noEmit
```

#### 3. Styling Issues
```bash
# Regenerate Tailwind CSS
pnpm dev

# Check Tailwind config
pnpm exec tailwindcss init --dry-run
```

#### 4. Build Issues
```bash
# Clean build directory
rm -rf .next

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Type check
pnpm tsc --noEmit
```

### Debug Mode

Enable debug features during development:

```typescript
// lib/constants.ts
export const isDevelopment = process.env.NODE_ENV === 'development';

// Use in components
{isDevelopment && <DebugGrid />}
```

## Deployment

### Vercel (Recommended)
```bash
# Deploy to Vercel
vercel --prod

# Environment variables in Vercel
# Add environment variables in Vercel dashboard
```

### Docker (Alternative)
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## Next Steps

After setup is complete:

1. **Explore the Codebase**: Review the component library and architecture
2. **Customize Branding**: Update colors, fonts, and styling
3. **Add Features**: Extend functionality based on your needs
4. **Deploy**: Set up production deployment

For more detailed information:
- [Architecture Guide](architecture.md) - Understand the technical architecture
- [Component Library](components.md) - Explore available components
- [API Integration](api-integration.md) - Learn about Shopify integration
- [Development Guide](development.md) - Development best practices