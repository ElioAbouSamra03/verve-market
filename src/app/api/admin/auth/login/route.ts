import { NextRequest } from "next/server";
import { adminLoginSchema } from "@/lib/validation/adminSchemas";
import { createAdminSession, verifyAdminPassword } from "@/lib/auth/adminSession";
import { assertNotRateLimited, clearAttempts, recordFailedAttempt } from "@/lib/auth/loginRateLimit";
import { UnauthorizedError } from "@/lib/errors";
import { ok, fail } from "@/lib/utils/apiResponse";

function clientKey(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

// POST /api/admin/auth/login — { password } -> sets the admin session cookie
export async function POST(request: NextRequest) {
  const key = clientKey(request);
  try {
    assertNotRateLimited(key);

    const body = await request.json();
    const { password } = adminLoginSchema.parse(body);

    if (!verifyAdminPassword(password)) {
      recordFailedAttempt(key);
      throw new UnauthorizedError("Incorrect password.");
    }

    clearAttempts(key);
    createAdminSession();
    return ok({ authenticated: true });
  } catch (err) {
    return fail(err);
  }
}
