const nextConfig = {
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-accordion',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-label',
      '@radix-ui/react-slot',
      'sonner',
      'date-fns',
      'cmdk',
      'embla-carousel-react',
    ],
  },
  images: {
    loader: 'custom',
    loaderFile: './lib/cloudinary-loader.ts',
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
    qualities: [70, 75, 80, 90, 100],
    unoptimized: true,
  },
  compress: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,

  // Headers for caching static assets and security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // CORS Headers for nbfhomes.in
          { key: 'Access-Control-Allow-Origin', value: 'https://www.nbfhomes.in' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' }, // APIs should generally not be cached unless specific
        ]
      },
      {
        source: '/(.*\.(?:jpg|jpeg|gif|png|webp|svg|ico)$)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      }
    ];
  },

  async redirects() {
    return [
      {
        source: '/shop',
        destination: '/properties',
        permanent: true,
      },
      {
        source: '/shop/:path*',
        destination: '/properties/:path*',
        permanent: true,
      },
    ];
  },
  webpack: (config, { webpack, isServer, nextRuntime }) => {
    // Avoid "process is not defined" in Edge Runtime (middleware)
    if (nextRuntime === 'edge') {
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
        })
      )
    }
    return config
  },
};




import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // Disable in development to prevent loops
  register: true,
  skipWaiting: true,
  clientsClaim: true, // Claim clients immediately for instant updates
  buildExcludes: [
    /middleware-manifest\.json$/,
    /_middleware.js$/,
    /_middleware.js.map$/,
    /middleware.js$/,
    /middleware.js.map$/
  ],
  runtimeCaching: [
    {
      urlPattern: /\/auth\/.*/,
      handler: 'NetworkOnly',
    },
    {
      urlPattern: /\/api\/auth\/.*/,
      handler: 'NetworkOnly',
    },
    {
      urlPattern: /^https:\/\/accounts\.google\.com\/.*/,
      handler: 'NetworkOnly',
    }
  ],
  fallbacks: {
    // document: '/offline', 
  }
});

export default withPWA(nextConfig);

