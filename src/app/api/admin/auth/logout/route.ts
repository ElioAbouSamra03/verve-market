import { destroyAdminSession } from "@/lib/auth/adminSession";
import { noContent, fail } from "@/lib/utils/apiResponse";

// POST /api/admin/auth/logout — clears the admin session cookie
export async function POST() {
  try {
    destroyAdminSession();
    return noContent();
  } catch (err) {
    return fail(err);
  }
}
