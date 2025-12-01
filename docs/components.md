# Component Library

## Overview

OMG Store features a comprehensive component library built on modern design principles, combining Radix UI primitives with custom business logic components. The library is organized into logical categories and follows consistent naming conventions and patterns.

## Component Categories

### 🎨 **Base UI Components** (`/components/ui/`)

Built on **Radix UI** primitives with custom styling via Tailwind CSS. These components provide accessible, unstyled foundations that can be customized for any design system.

#### **Core Components**

| Component | Purpose | Radix Base | Key Features |
|-----------|---------|------------|--------------|
| [`Button`](./ui/button.tsx) | Interactive button element | `@radix-ui/react-slot` | Variants, sizes, loading states |
| [`Input`](./ui/input.tsx) | Text input fields | Native HTML | Validation states, icons |
| [`Dialog`](./ui/dialog.tsx) | Modal dialogs | `@radix-ui/react-dialog` | Nested dialogs, focus trap |
| [`Select`](./ui/select.tsx) | Dropdown selection | `@radix-ui/react-select` | Grouped options, search |
| [`Card`](./ui/card.tsx) | Content containers | Custom component | Shadow, borders, padding |
| [`Badge`](./ui/badge.tsx) | Status indicators | Custom component | Variants, sizes |
| [`Skeleton`](./ui/skeleton.tsx) | Loading placeholders | Custom component | Pulse animations |

#### **Navigation Components**

| Component | Purpose | Radix Base | Key Features |
|-----------|---------|------------|--------------|
| [`NavigationMenu`](./ui/navigation-menu.tsx) | Navigation menus | `@radix-ui/react-navigation-menu` | Submenus, keyboard nav |
| [`Breadcrumb`](./ui/breadcrumb.tsx) | Page hierarchy | `@radix-ui/react-navigation-menu` | Auto-generated paths |
| [`Pagination`](./ui/pagination.tsx) | Page navigation | Custom component | Total pages, page size |
| [`Tabs`](./ui/tabs.tsx) | Tabbed content | `@radix-ui/react-tabs` | Controlled/uncontrolled |

#### **Feedback Components**

| Component | Purpose | Radix Base | Key Features |
|-----------|---------|------------|--------------|
| [`Toast`](./ui/toast.tsx) | Temporary notifications | `@radix-ui/react-toast` | Auto-dismiss, actions |
| [`Alert`](./ui/alert.tsx) | Important messages | Custom component | Variants, icons |
| [`Spinner`](./ui/spinner.tsx) | Loading indicators | Custom component | Sizes, colors |
| [`Progress`](./ui/progress.tsx) | Progress bars | `@radix-ui/react-progress` | Determinate/indeterminate |

#### **Data Display Components**

| Component | Purpose | Radix Base | Key Features |
|-----------|---------|------------|--------------|
| [`Table`](./ui/table.tsx) | Tabular data | Custom component | Sortable, responsive |
| [`Avatar`](./ui/avatar.tsx) | User avatars | `@radix-ui/react-avatar` | Fallbacks, images |
| [`Tooltip`](./ui/tooltip.tsx) | Hover tooltips | `@radix-ui/react-tooltip` | Rich content, positioning |
| [`Popover`](./ui/popover.tsx) | Hover/click popovers | `@radix-ui/react-popover` | Nested content |

#### **Form Components**

| Component | Purpose | Radix Base | Key Features |
|-----------|---------|------------|--------------|
| [`Form`](./ui/form.tsx) | Form containers | Custom component | Zod validation, error states |
| [`Checkbox`](./ui/checkbox.tsx) | Checkbox inputs | `@radix-ui/react-checkbox` | Indeterminate state |
| [`RadioGroup`](./ui/radio-group.tsx) | Radio button groups | `@radix-ui/react-radio-group` | Orientation, validation |
| [`Switch`](./ui/switch.tsx) | Toggle switches | `@radix-ui/react-switch` | Labels, validation |

### 🛍️ **Business Components** (`/components/`)

Specialized components that implement specific e-commerce functionality and business logic.

#### **Cart Components** (`/components/cart/`)

##### **CartProvider** (`cart-context.tsx`)
- **Purpose**: Global cart state management
- **Features**: Optimistic updates, server synchronization, persistence
- **Usage**: Wraps the entire application

```typescript
// Usage example
export function App() {
  return (
    <CartProvider>
      <YourApp />
    </CartProvider>
  );
}
```

##### **AddToCart** (`add-to-cart.tsx`)
- **Purpose**: Add products to cart with variant selection
- **Features**: Form validation, loading states, success feedback
- **Props**: `product`, `variants`, `onSuccess`

```typescript
interface AddToCartProps {
  product: ShopifyProduct;
  variants: ShopifyVariant[];
  onSuccess?: (cart: ShopifyCart) => void;
}

export function AddToCart({ product, variants, onSuccess }: AddToCartProps) {
  // Implementation with server actions
}
```

##### **CartModal** (`modal.tsx`)
- **Purpose**: Slide-out cart drawer
- **Features**: Cart preview, quantity editing, checkout redirect
- **Usage**: Triggered by cart icon

##### **CartItem** (`cart-item.tsx`)
- **Purpose**: Individual cart item display
- **Features**: Image, title, price, quantity controls, remove button
- **Props**: `item`, `onUpdateQuantity`, `onRemove`

#### **Product Components** (`/components/products/`)

##### **ProductCard** (`/components/product-card/index.tsx`)
- **Purpose**: Reusable product display in grids/lists
- **Features**: Image, title, price, variant indicators, quick actions
- **Variants**: Default, featured, compact

```typescript
interface ProductCardProps {
  product: ShopifyProduct;
  variant?: 'default' | 'featured' | 'compact';
  showQuickAdd?: boolean;
  priority?: boolean; // For LCP optimization
}

export function ProductCard({ 
  product, 
  variant = 'default',
  showQuickAdd = true 
}: ProductCardProps) {
  // Implementation with image optimization
}
```

##### **ProductImage** (`/components/product-card/product-image.tsx`)
- **Purpose**: Optimized product image display
- **Features**: Next.js Image, placeholder blur, responsive sizes
- **Props**: `product`, `priority`, `sizes`

##### **VariantSelector** (`variant-selector.tsx`)
- **Purpose**: Product variant selection interface
- **Features**: Color swatches, size options, availability checking
- **Props**: `variants`, `selectedVariant`, `onVariantChange`

```typescript
interface VariantSelectorProps {
  variants: ShopifyVariant[];
  selectedVariant: ShopifyVariant | null;
  onVariantChange: (variantId: string) => void;
  showColorSwatches?: boolean;
  showSizeOptions?: boolean;
}

export function VariantSelector({ 
  variants, 
  selectedVariant, 
  onVariantChange,
  showColorSwatches = true 
}: VariantSelectorProps) {
  // Color swatch implementation
  const colorOptions = variants.reduce((acc, variant) => {
    const colorOption = variant.selectedOptions.find(
      option => option.name.toLowerCase() === 'color'
    );
    if (colorOption && !acc.includes(colorOption.value)) {
      acc.push(colorOption.value);
    }
    return acc;
  }, [] as string[]);

  return (
    <div className="space-y-4">
      {showColorSwatches && colorOptions.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Color</label>
          <div className="flex gap-2">
            {colorOptions.map(color => (
              <ColorSwatch
                key={color}
                color={color}
                selected={selectedVariant?.selectedOptions.find(
                  opt => opt.name.toLowerCase() === 'color'
                )?.value === color}
                onSelect={() => {
                  const newVariant = variants.find(v => 
                    v.selectedOptions.find(opt => 
                      opt.name.toLowerCase() === 'color' && opt.value === color
                    )
                  );
                  if (newVariant) onVariantChange(newVariant.id);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

##### **LatestProductCard** (`latest-product-card.tsx`)
- **Purpose**: Highlighted product cards for featured sections
- **Features**: Special styling, call-to-action emphasis
- **Usage**: Homepage, collection headers

#### **Layout Components** (`/components/layout/`)

##### **Header** (`/header/index.tsx`)
- **Purpose**: Main application header
- **Features**: Logo, navigation, cart icon, mobile menu
- **Props**: `collections` (from server)

```typescript
interface HeaderProps {
  collections: ShopifyCollection[];
}

export function Header({ collections }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Logo />
          <Navigation collections={collections} />
          <CartButton />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
```

##### **Footer** (`footer.tsx`)
- **Purpose**: Application footer with links and information
- **Features**: Social links, policies, newsletter signup
- **Sections**: Company info, customer service, legal

##### **Sidebar** (`/sidebar/`)
- **Purpose**: Mobile navigation and filters
- **Types**: `HomeSidebar`, `ProductSidebar`

#### **Shop Components** (`/app/shop/components/`)

##### **ProductGrid** (`product-grid.tsx`)
- **Purpose**: Responsive grid layout for products
- **Features**: Responsive breakpoints, loading states, empty states
- **Usage**: Collection pages, search results

```typescript
interface ProductGridProps {
  products: ShopifyProduct[];
  isLoading?: boolean;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
  };
}

export function ProductGrid({ 
  products, 
  isLoading = false,
  columns = { sm: 1, md: 2, lg: 3, xl: 4 }
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className={`grid gap-4 md:gap-6 grid-cols-${columns.sm} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg} xl:grid-cols-${columns.xl}`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className={`grid gap-4 md:gap-6 grid-cols-${columns.sm} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg} xl:grid-cols-${columns.xl}`}>
      {products.map(product => (
        <ProductCard 
          key={product.id} 
          product={product}
          priority={product.id === products[0]?.id}
        />
      ))}
    </div>
  );
}
```

##### **CategoryFilter** (`category-filter.tsx`)
- **Purpose**: Product category filtering
- **Features**: Multi-select, counts, expand/collapse
- **Props**: `categories`, `selectedCategories`, `onCategoryChange`

##### **ColorFilter** (`color-filter.tsx`)
- **Purpose**: Color-based product filtering
- **Features**: Color swatches, availability checking
- **Usage**: Combined with other filters

##### **SortDropdown** (`sort-dropdown.tsx`)
- **Purpose**: Product sorting interface
- **Options**: Price, name, newest, popularity
- **Props**: `currentSort`, `onSortChange`

##### **ShopFilters** (`shop-filters.tsx`)
- **Purpose**: Combined filtering interface
- **Features**: Mobile drawer, desktop sidebar
- **State**: URL synchronization

### 🪝 **Custom Hooks** (`/lib/hooks/`, `/hooks/`)

Reusable logic components that can be used across different components.

#### **State Management Hooks**

##### **useMobile** (`/hooks/use-mobile.ts`)
```typescript
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return isMobile;
}
```

##### **useBodyScrollLock** (`/lib/hooks/use-body-scroll-lock.ts`)
```typescript
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (locked) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [locked]);
}
```

##### **useAvailableColors** (`/app/shop/hooks/use-available-colors.tsx`)
```typescript
export function useAvailableColors(products: ShopifyProduct[]) {
  return useMemo(() => {
    const colorMap = new Map<string, number>();
    
    products.forEach(product => {
      product.variants?.edges.forEach(({ node }) => {
        const colorOption = node.selectedOptions.find(
          option => option.name.toLowerCase() === 'color'
        );
        if (colorOption) {
          colorMap.set(colorOption.value, 
            (colorMap.get(colorOption.value) || 0) + 1
          );
        }
      });
    });
    
    return Array.from(colorMap.entries())
      .map(([color, count]) => ({ color, count }))
      .sort((a, b) => a.color.localeCompare(b.color));
  }, [products]);
}
```

##### **useFilterCount** (`/app/shop/hooks/use-filter-count.tsx`)
```typescript
export function useFilterCount(
  products: ShopifyProduct[],
  filterFn: (product: ShopifyProduct) => boolean
) {
  return useMemo(() => {
    return products.filter(filterFn).length;
  }, [products, filterFn]);
}
```

#### **API Hooks**

##### **useCart** (integrated in CartProvider)
```typescript
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
```

##### **useToast** (`/hooks/use-toast.ts`)
```typescript
export function useToast() {
  const { toasts, toast, dismiss, update } = useContext(ToastContext);

  return {
    toasts,
    toast: (props: ToastProps) => toast(props),
    dismiss: (toastId?: string) => dismiss(toastId),
    update: (props: ToastUpdateProps) => update(props)
  };
}
```

### 🎨 **Styling System**

#### **Design Tokens**
```typescript
// Tailwind config extends
module.exports = {
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
};
```

#### **Component Variants**
```typescript
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
```

### 📱 **Responsive Design Patterns**

#### **Breakpoint System**
```typescript
// Tailwind breakpoints
const breakpoints = {
  sm: '640px',   // Small devices
  md: '768px',   // Medium devices  
  lg: '1024px',  // Large devices
  xl: '1280px',  // Extra large
  '2xl': '1536px' // 2X large
};

// Component usage
export function ResponsiveGrid({ children }) {
  return (
    <div className="
      grid grid-cols-1        // Mobile: 1 column
      sm:grid-cols-2          // Small: 2 columns  
      md:grid-cols-3          // Medium: 3 columns
      lg:grid-cols-4          // Large: 4 columns
      xl:grid-cols-5          // Extra large: 5 columns
      gap-4                   // Base gap
      md:gap-6                // Medium+: larger gap
    ">
      {children}
    </div>
  );
}
```

#### **Mobile Navigation Pattern**
```typescript
export function MobileNavigation({ isOpen, onClose, children }) {
  useBodyScrollLock(isOpen);
  
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div className={cn(
        "fixed top-0 left-0 h-full w-80 bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4">
          {children}
        </div>
      </div>
    </>
  );
}
```

### 🔧 **Component Usage Examples**

#### **Building a Product Page**
```typescript
export default function ProductPage({ params }: { params: { handle: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <ProductGallery product={product} />
        </div>
        
        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.title}</h1>
            <p className="text-2xl text-primary mt-2">
              ${product.priceRange.minVariantPrice.amount}
            </p>
          </div>
          
          <VariantSelector
            variants={product.variants.edges.map(e => e.node)}
            selectedVariant={selectedVariant}
            onVariantChange={setSelectedVariant}
          />
          
          <AddToCart
            product={product}
            variants={product.variants.edges.map(e => e.node)}
            selectedVariant={selectedVariant}
          />
          
          <div className="prose">
            <div dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### **Building a Collection Page**
```typescript
export default function CollectionPage({ params }: { params: { collection: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <ShopBreadcrumb collection={params.collection} />
      
      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <ShopFilters 
            products={products}
            selectedFilters={selectedFilters}
            onFiltersChange={setSelectedFilters}
          />
        </aside>
        
        {/* Main Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <ResultsCount products={products} />
            <SortDropdown 
              currentSort={sort}
              onSortChange={setSort}
            />
          </div>
          
          <ProductGrid products={products} />
          
          {hasMore && (
            <div className="text-center mt-8">
              <Button 
                onClick={loadMore}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

This comprehensive component library provides all the building blocks needed to create rich, accessible, and performant e-commerce interfaces while maintaining consistency and developer productivity.