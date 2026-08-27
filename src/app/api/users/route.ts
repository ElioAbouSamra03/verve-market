import { NextRequest } from "next/server";
import { createUser } from "@/lib/db/users";
import { createUserSchema } from "@/lib/validation/schemas";
import { created, fail } from "@/lib/utils/apiResponse";

// POST /api/users — create a user profile record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = createUserSchema.parse(body);
    const user = await createUser(input);
    return created(user);
  } catch (err) {
    return fail(err);
  }
}
