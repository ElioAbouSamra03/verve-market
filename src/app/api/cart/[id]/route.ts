import { NextRequest } from "next/server";
import { removeCartItem, updateCartItemQuantity } from "@/lib/db/cart";
import { updateCartItemSchema } from "@/lib/validation/schemas";
import { getOrCreateUserId } from "@/lib/utils/session";
import { ok, noContent, fail } from "@/lib/utils/apiResponse";

// PATCH /api/cart/:productId?variantId=... — update line item quantity
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getOrCreateUserId();
    const variantId = request.nextUrl.searchParams.get("variantId") ?? undefined;
    const body = await request.json();
    const { quantity } = updateCartItemSchema.parse(body);
    const item = await updateCartItemQuantity(userId, params.id, variantId, quantity);
    return ok(item);
  } catch (err) {
    return fail(err);
  }
}

// DELETE /api/cart/:productId?variantId=... — remove a single line item
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getOrCreateUserId();
    const variantId = request.nextUrl.searchParams.get("variantId") ?? undefined;
    await removeCartItem(userId, params.id, variantId);
    return noContent();
  } catch (err) {
    return fail(err);
  }
}
