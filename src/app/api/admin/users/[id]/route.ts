import { requireAdminApi } from "@/lib/auth/adminSession";
import { deleteUser, getUserById, updateUser } from "@/lib/db/users";
import { clearCart } from "@/lib/db/cart";
import { clearWishlist } from "@/lib/db/wishlist";
import { updateUserSchema } from "@/lib/validation/adminSchemas";
import { ok, noContent, fail } from "@/lib/utils/apiResponse";

// GET /api/admin/users/:id
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    requireAdminApi();
    const user = await getUserById(params.id);
    return ok(user);
  } catch (err) {
    return fail(err);
  }
}

// PATCH /api/admin/users/:id — update name/email/avatar
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    requireAdminApi();
    const body = await request.json();
    const input = updateUserSchema.parse(body);
    const updated = await updateUser(params.id, input);
    return ok(updated);
  } catch (err) {
    return fail(err);
  }
}

// DELETE /api/admin/users/:id — also clears the user's cart and wishlist so
// no rows are left pointing at a userId that no longer exists.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    requireAdminApi();
    await getUserById(params.id); // 404s cleanly if the user doesn't exist
    await Promise.all([clearCart(params.id), clearWishlist(params.id)]);
    await deleteUser(params.id);
    return noContent();
  } catch (err) {
    return fail(err);
  }
}
