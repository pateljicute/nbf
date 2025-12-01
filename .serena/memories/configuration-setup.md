# Configuration & Setup

## Next.js Config (`next.config.mjs`)
```javascript
experimental: {
  inlineCss: true,
  useCache: true,
  clientSegmentCache: true,
}
eslint: { ignoreDuringBuilds: true }
typescript: { ignoreBuildErrors: true }
images: {
  unoptimized: true,
  formats: ['image/avif', 'image/webp'],
  remotePatterns: [
    { protocol: 'https', hostname: 'zylq-002.dx.commercecloud.salesforce.com' },
    { protocol: 'https', hostname: 'edge.disstg.commercecloud.salesforce.com' }
  ]
}
```

## TypeScript Config (`tsconfig.json`)
- Target: ES6
- Strict mode enabled
- Module: esnext
- Module resolution: bundler
- Path alias: `@/*` → `./*`
- JSX: preserve

## Package Manager
- pnpm (preferred)
- Scripts: dev, build, start, lint

## Environment Variables (Required)
- `SHOPIFY_STORE_DOMAIN` - Shopify store domain
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN` - API access token

## Styling Setup
- Tailwind CSS 4.1.13
- PostCSS with @tailwindcss/postcss
- Typography plugin
- Custom animations
- CSS variables for theming

## Fonts
- Geist Sans (primary)
- Geist Mono (monospace)
- Loaded in root layout

## Analytics
- Vercel Analytics integrated
- Configured in root layout

## Development Workflow
1. Built on v0.app platform
2. Auto-synced to GitHub
3. Deployed on Vercel
4. Hot reload in development

## Build Configuration
- ESLint errors ignored during builds
- TypeScript errors ignored during builds
- Image optimization disabled (unoptimized: true)
