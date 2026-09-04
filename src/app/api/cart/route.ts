import { NextRequest } from "next/server";
import { addToCart, clearCart, getCart } from "@/lib/db/cart";
import { addToCartSchema } from "@/lib/validation/schemas";
import { getOrCreateUserId } from "@/lib/utils/session";
import { ok, created, noContent, fail } from "@/lib/utils/apiResponse";

// GET /api/cart — current user's cart with computed subtotal
export async function GET() {
  try {
    const userId = getOrCreateUserId();
    const cart = await getCart(userId);
    return ok(cart);
  } catch (err) {
    return fail(err);
  }
}

// POST /api/cart — add an item (or increase quantity of an existing one)
export async function POST(request: NextRequest) {
  try {
    const userId = getOrCreateUserId();
    const body = await request.json();
    const input = addToCartSchema.parse(body);
    const item = await addToCart(userId, input);
    return created(item);
  } catch (err) {
    return fail(err);
  }
}

// DELETE /api/cart — empty the entire cart
export async function DELETE() {
  try {
    const userId = getOrCreateUserId();
    await clearCart(userId);
    return noContent();
  } catch (err) {
    return fail(err);
  }
}
