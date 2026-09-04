import { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/adminSession";
import { removeCartItem } from "@/lib/db/cart";
import { noContent, fail } from "@/lib/utils/apiResponse";

// DELETE /api/admin/cart/:userId/:productId?variantId= — remove one line item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string; productId: string } }
) {
  try {
    requireAdminApi();
    const variantId = request.nextUrl.searchParams.get("variantId") ?? undefined;
    await removeCartItem(params.userId, params.productId, variantId);
    return noContent();
  } catch (err) {
    return fail(err);
  }
}
