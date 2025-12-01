'use client';

import { ArrowRight, PlusCircleIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useCart } from './cart-context';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/button';
import { Loader } from '../ui/loader';
import { CartItemCard } from './cart-item';
import { formatPrice } from '@/lib/utils';
import { useBodyScrollLock } from '@/lib/hooks/use-body-scroll-lock';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Cart } from '../../lib/shopify/types';

const CartContainer = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <div className={cn('px-3 md:px-4', className)}>{children}</div>;
};

const CartItems = ({ closeCart }: { closeCart: () => void }) => {
  const { cart } = useCart();

  if (!cart) return <></>;

  return (
    <div className="flex flex-col justify-between h-full overflow-hidden">
      <CartContainer className="flex justify-between text-sm text-muted-foreground">
        <span>Products</span>
        <span>{cart.lines.length} items</span>
      </CartContainer>
      <div className="relative flex-1 min-h-0 py-4 overflow-x-hidden">
        <CartContainer className="overflow-y-auto flex flex-col gap-y-3 h-full scrollbar-hide">
          <AnimatePresence>
            {cart.lines.map(item => (
              <motion.div
                key={item.merchandise.id}
                layout
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <CartItemCard item={item} onCloseCart={closeCart} />
              </motion.div>
            ))}
          </AnimatePresence>
        </CartContainer>
      </div>
      <CartContainer>
        <div className="py-4 text-sm text-foreground/50 shrink-0">
          <div className="flex justify-between items-center pb-1 mb-3 border-b border-muted-foreground/20">
            <p>Taxes</p>
            <p className="text-right">Calculated at checkout</p>
          </div>
          <div className="flex justify-between items-center pt-1 pb-1 mb-3 border-b border-muted-foreground/20">
            <p>Shipping</p>
            <p className="text-right">Calculated at checkout</p>
          </div>
          <div className="flex justify-between items-center pt-1 pb-1 mb-1.5 text-lg font-semibold">
            <p>Total</p>
            <p className="text-base text-right text-foreground">
              {formatPrice(cart.cost.totalAmount.amount, cart.cost.totalAmount.currencyCode)}
            </p>
          </div>
        </div>
        <CheckoutButton />
      </CartContainer>
    </div>
  );
};

const serializeCart = (cart: Cart) => {
  return JSON.stringify(
    cart.lines.map(line => ({
      merchandiseId: line.merchandise.id,
      quantity: line.quantity,
    }))
  );
};

import { createPortal } from 'react-dom';

// ... (existing imports)

export default function CartModal() {
  const { isPending, cart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const serializedCart = useRef(cart ? serializeCart(cart) : undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!cart || isPending) return;

    const newSerializedCart = serializeCart(cart);

    // Initialize on first load
    if (serializedCart.current === undefined) {
      serializedCart.current = newSerializedCart;
      return;
    }

    // Only open cart if items were actually added/changed
    if (serializedCart.current !== newSerializedCart) {
      serializedCart.current = newSerializedCart;
      setIsOpen(true);
    }
  }, [cart, isPending]);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const renderCartContent = () => {
    if (!cart || cart.lines.length === 0) {
      return (
        <CartContainer className="flex w-full">
          <Link
            href="/shop"
            className="p-2 w-full rounded-lg border border-dashed bg-background border-border"
            onClick={closeCart}
          >
            <div className="flex flex-row gap-6">
              <div className="flex overflow-hidden relative justify-center items-center rounded-sm border border-dashed size-20 shrink-0 border-border">
                <PlusCircleIcon className="size-6 text-muted-foreground" />
              </div>
              <div className="flex flex-col flex-1 gap-2 justify-center 2xl:gap-3">
                <span className="text-lg font-semibold 2xl:text-xl">Cart is empty</span>
                <p className="text-sm text-muted-foreground hover:underline">Start shopping to get started</p>
              </div>
            </div>
          </Link>
        </CartContainer>
      );
    }

    return <CartItems closeCart={closeCart} />;
  };

  return (
    <>
      <Button aria-label="Open cart" onClick={openCart} className="uppercase" size={'sm'}>
        <span className="max-md:hidden">cart</span> ({cart?.totalQuantity || 0})
      </Button>
      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="fixed inset-0 z-[100] bg-foreground/30 backdrop-blur-sm"
                onClick={closeCart}
                aria-hidden="true"
              />

              {/* Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="fixed top-0 bottom-0 right-0 flex w-full md:w-[500px] z-[101]"
              >
                <div className="flex flex-col w-full h-full bg-background shadow-2xl border-l border-neutral-200">
                  <div className="flex items-center justify-between p-6 border-b border-neutral-100">
                    <h2 className="text-2xl font-serif font-medium">Your Cart</h2>
                    <button
                      onClick={closeCart}
                      className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                    >
                      <span className="sr-only">Close</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6">
                    {renderCartContent()}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

function CheckoutButton() {
  const { pending } = useFormStatus();
  const { cart, isPending } = useCart();
  const router = useRouter();

  const checkoutUrl = cart?.checkoutUrl;

  const isLoading = pending;
  const isDisabled = !checkoutUrl || isPending;

  return (
    <Button
      type="submit"
      disabled={isDisabled}
      size="lg"
      className="flex relative gap-3 justify-between items-center w-full"
      onClick={() => {
        if (checkoutUrl) {
          router.push(checkoutUrl);
        }
      }}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={isLoading ? 'loading' : 'content'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex justify-center items-center w-full"
        >
          {isLoading ? (
            <Loader size="default" />
          ) : (
            <div className="flex justify-between items-center w-full">
              <span>Proceed to Checkout</span>
              <ArrowRight className="size-6" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Button>
  );
}
