/**
 * Cart domain types.
 *
 * DynamoDB table: verve_cart
 * PK: USER#<userId>   SK: ITEM#<productId>#<variantId|"base">
 *
 * Each cart line item is its own item in DynamoDB (rather than one big JSON blob)
 * so that quantity updates and removals are single, cheap, conditional writes
 * instead of read-modify-write races on a single document.
 */

export interface CartItem {
  userId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  // Denormalized snapshot fields so the cart can render without a join,
  // and so historical cart totals stay stable even if the product changes.
  productSnapshot: {
    name: string;
    slug: string;
    image: string;
    unitPriceCents: number;
    currency: string;
    variantLabel?: string;
  };
  addedAt: string;
  updatedAt: string;
}

export interface CartSummary {
  items: CartItem[];
  itemCount: number; // sum of quantities
  subtotalCents: number;
  currency: string;
}

export interface AddToCartInput {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}
