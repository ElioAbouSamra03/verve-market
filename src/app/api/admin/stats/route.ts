import { requireAdminApi } from "@/lib/auth/adminSession";
import { getDashboardStats } from "@/lib/db/adminStats";
import { ok, fail } from "@/lib/utils/apiResponse";

// GET /api/admin/stats — dashboard counters + short lists
export async function GET() {
  try {
    requireAdminApi();
    const stats = await getDashboardStats();
    return ok(stats);
  } catch (err) {
    return fail(err);
  }
}
