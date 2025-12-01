export interface Money {
  amount: string;
  currencyCode: string;
}

export interface Image {
  url: string;
  altText: string;
  thumbhash?: string;
  width?: number;
  height?: number;
  selectedOptions?: Array<{ name: string; value: string }>;
}

export interface ProductOption {
  id: string;
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: string;
  title: string;
  price: Money;
  availableForSale: boolean;
  selectedOptions?: Array<{ name: string; value: string }>;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml?: string;
  categoryId?: string;
  currencyCode: string;
  featuredImage?: Image;
  seo: {
    title: string;
    description: string;
  };
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
  compareAtPriceRange?: Money;
  compareAtPrice?: Money;
  images: Image[];
  options: ProductOption[];
  variants: ProductVariant[];
  tags?: string[];
  availableForSale: boolean;
  userId?: string;
  contactNumber?: string;
}

export interface Collection {
  id: string;
  handle: string;
  title: string;
  description: string;
  seo: {
    title: string;
    description: string;
  };
  path: string;
  parentCategoryTree?: { id: string; name: string }[];
}

export interface CartItem {
  id: string;
  quantity: number;
  cost: {
    totalAmount: Money;
  };
  merchandise: {
    id: string;
    title: string;
    selectedOptions: Array<{ name: string; value: string }>;
    product: {
      id: string;
      handle: string;
      title: string;
      featuredImage?: Image;
    };
    price: Money;
  };
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
    totalTaxAmount?: Money;
  };
  lines: CartItem[];
  totalQuantity: number;
}

export type ProductSortKey = 'RELEVANCE' | 'BEST_SELLING' | 'CREATED_AT' | 'PRICE';
export type ProductCollectionSortKey = 'RELEVANCE' | 'BEST_SELLING' | 'CREATED' | 'PRICE';

export interface SelectedOptions {
  [key: string]: string;
}

export interface CartProduct extends Product {
  selectedVariant?: ProductVariant;
}

export interface NavItem {
  label: string;
  href: string;
}
