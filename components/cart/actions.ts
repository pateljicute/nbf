'use server';

import { revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  addToCart as apiAddToCart,
  createCart as apiCreateCart,
  getCart as apiGetCart,
  removeFromCart as apiRemoveFromCart,
  updateCart as apiUpdateCart,
} from '@/lib/api';
import type { Cart } from '@/lib/types';

export async function addItem(
  prevState: unknown,
  selectedVariantId: string | undefined
): Promise<{ message?: string; cart?: Cart }> {
  const cartId = (await cookies()).get('cartId')?.value;

  if (!cartId || !selectedVariantId) {
    return { message: 'Missing cart or variant ID' };
  }

  try {
    const cart = await apiAddToCart(cartId, [{ merchandiseId: selectedVariantId, quantity: 1 }]);
    revalidateTag('cart');
    return { cart };
  } catch (e) {
    return { message: 'Error adding item to cart' };
  }
}

export async function updateItemQuantity(
  prevState: unknown,
  payload: { lineId: string; variantId: string; quantity: number }
): Promise<{ message?: string; cart?: Cart }> {
  const cartId = (await cookies()).get('cartId')?.value;

  if (!cartId) {
    return { message: 'Missing cart ID' };
  }

  const { lineId, variantId, quantity } = payload;

  try {
    if (quantity === 0) {
      const cart = await apiRemoveFromCart(cartId, [lineId]);
      revalidateTag('cart');
      return { cart };
    }

    const cart = await apiUpdateCart(cartId, [{ id: lineId, merchandiseId: variantId, quantity }]);
    revalidateTag('cart');
    return { cart };
  } catch (e) {
    return { message: 'Error updating item quantity' };
  }
}

export async function removeItem(prevState: unknown, lineId: string): Promise<{ message?: string; cart?: Cart }> {
  const cartId = (await cookies()).get('cartId')?.value;

  if (!cartId) {
    return { message: 'Missing cart ID' };
  }

  try {
    const cart = await apiRemoveFromCart(cartId, [lineId]);
    revalidateTag('cart');
    return { cart };
  } catch (e) {
    return { message: 'Error removing item from cart' };
  }
}

export async function createCartAndSetCookie(): Promise<void> {
  const cart = await apiCreateCart();
  (await cookies()).set('cartId', cart.id);
}

export async function getCart(): Promise<Cart | null> {
  const cartId = (await cookies()).get('cartId')?.value;

  if (!cartId) {
    return null;
  }

  return await apiGetCart(cartId);
}

export async function redirectToCheckout(): Promise<never> {
  const cartId = (await cookies()).get('cartId')?.value;

  if (!cartId) {
    return redirect('/');
  }

  const cart = await apiGetCart(cartId);

  if (!cart) {
    return redirect('/');
  }

  redirect(cart.checkoutUrl);
}

export async function updateItem(payload: { lineId: string; quantity: number }): Promise<Cart | null> {
  const cartId = (await cookies()).get('cartId')?.value;
  if (!cartId) return null;

  const { lineId, quantity } = payload;

  try {
    if (quantity === 0) {
      return await apiRemoveFromCart(cartId, [lineId]);
    }
    const item = (await apiGetCart(cartId))?.lines.find(l => l.id === lineId);
    if (!item) return null;
    return await apiUpdateCart(cartId, [{ id: lineId, merchandiseId: item.merchandise.id, quantity }]);
  } catch {
    return null;
  }
}
