# Cart System

## Location
`components/cart/`

## Key Files
- `cart-context.tsx` - Context provider & reducer
- `actions.ts` - Server actions for cart operations
- `cart-modal.tsx` - Cart UI modal
- `cart-item.tsx` - Individual cart item component

## Cart Context (cart-context.tsx)

### State Management
- Context-based with useReducer
- Persistent via cookies (cart ID)
- Real-time total calculations

### Cart Actions
- `ADD` - Add item to cart
- `UPDATE` - Update item quantity
- `REMOVE` - Remove item from cart
- `SET` - Set entire cart state

### Key Functions
- `calculateItemCost()` - Calculate item subtotal
- `updateCartTotals()` - Recalculate cart totals
- `cartReducer()` - State reducer
- `createEmptyCart()` - Initialize empty cart
- `useCart()` - Hook to access cart context

### Cart State Structure
```typescript
{
  id: string
  items: CartItem[]
  totalQuantity: number
  cost: {
    subtotalAmount: Money
    totalAmount: Money
    totalTaxAmount: Money
  }
}
```

## Server Actions (actions.ts)
- Handle Shopify API calls
- Cookie management for cart ID
- Error handling
- Optimistic updates

## Data Flow
1. User action triggers context dispatch
2. Reducer updates local state
3. Server action calls Shopify API
4. Cookie stores cart ID
5. UI updates optimistically
