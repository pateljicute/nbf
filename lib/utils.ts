import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { COLOR_MAP } from './constants';
import { Money } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBaseUrl() {
  if (typeof window !== 'undefined') return window.location.origin;
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  return 'https://nbf-x-39dd7c53.vercel.app';
}

export function formatPrice(amount: string | number | Money, currencyCode?: string) {
  if (typeof amount === 'object' && 'amount' in amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(Number(amount.amount));
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(Number(amount));
}

export function getProductId(gid: string): string {
  return gid.split('/').pop() || gid;
}

export const getShopifyProductId = getProductId;

export function mapSortKeys(sortKey?: string, type?: 'product' | 'collection'): { sortKey: string; reverse: boolean } {
  const defaultSort = { sortKey: 'RELEVANCE', reverse: false };
  if (!sortKey) return defaultSort;

  switch (sortKey) {
    case 'price-asc':
      return { sortKey: 'PRICE', reverse: false };
    case 'price-desc':
      return { sortKey: 'PRICE', reverse: true };
    case 'created-desc':
    case 'newest':
      return { sortKey: type === 'collection' ? 'CREATED' : 'CREATED_AT', reverse: true };
    case 'created-asc':
    case 'oldest':
      return { sortKey: type === 'collection' ? 'CREATED' : 'CREATED_AT', reverse: false };
    case 'best-selling':
      return { sortKey: 'BEST_SELLING', reverse: false };
    default:
      return defaultSort;
  }
}

export function createUrl(pathname: string, params: URLSearchParams | string) {
  const paramsString = params?.toString();
  const queryString = `${paramsString.length ? '?' : ''}${paramsString}`;

  return `${pathname}${queryString}`;
}

export function getColorHex(colorName: string): string | [string, string] {
  const lowerColorName = colorName.toLowerCase();

  // Check for exact match first
  if (COLOR_MAP[lowerColorName]) {
    return COLOR_MAP[lowerColorName];
  }

  // Check for partial matches (for cases where color name might have extra text)
  for (const [key, value] of Object.entries(COLOR_MAP)) {
    if (lowerColorName.includes(key) || key.includes(lowerColorName)) {
      return value;
    }
  }

  // Return a default color if no match found
  return '#666666';
}

export const getLabelPosition = (index: number): 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' => {
  const positions = ['top-left', 'bottom-right', 'top-right', 'bottom-left'] as const;
  return positions[index % positions.length];
};
