import { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/adminSession";
import { listUsers } from "@/lib/db/users";
import { adminUserQuerySchema } from "@/lib/validation/adminSchemas";
import { ok, fail } from "@/lib/utils/apiResponse";

// GET /api/admin/users?q=&page=&pageSize=
export async function GET(request: NextRequest) {
  try {
    requireAdminApi();
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const filters = adminUserQuerySchema.parse(params);
    const result = await listUsers(filters);
    return ok(result);
  } catch (err) {
    return fail(err);
  }
}
