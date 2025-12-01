# Shopify Integration

## Location
`lib/shopify/`

## Key Files
- `shopify.ts` - API fetch functions
- `types.ts` - TypeScript type definitions
- `index.ts` - Data adapter functions

## API Functions (shopify.ts)

### Product Functions
- `getProducts()` - Fetch all/filtered products
- `getProduct(handle)` - Single product by handle
- `getCollections()` - All collections
- `getCollectionProducts(collection)` - Products in collection

### Cart Functions
- `getCart(cartId)` - Fetch cart by ID
- `createCart()` - Create new cart
- `addCartLines(cartId, lines)` - Add items to cart
- `updateCartLines(cartId, lines)` - Update quantities
- `removeCartLines(cartId, lineIds)` - Remove items

## Configuration
- `SHOPIFY_STORE_DOMAIN` - Store domain from env
- `SHOPIFY_STOREFRONT_API_URL` - API endpoint
- `shopifyFetch()` - Base fetch function with auth

## Type Definitions (types.ts)
- Product, ProductVariant, ProductOption
- Cart, CartItem, CartProduct
- Collection, Image, Money
- SEO, SelectedOptions
- ShopifyCart, ShopifyCartLine (raw API types)

## Data Flow
1. GraphQL query to Shopify API
2. Raw response transformed by adapters
3. Type-safe data returned to components
