import { NextRequest } from "next/server";
import { listProducts } from "@/lib/db/products";
import { productQuerySchema } from "@/lib/validation/schemas";
import { ok, fail } from "@/lib/utils/apiResponse";

// GET /api/products?category=&q=&minPrice=&maxPrice=&sort=&page=&pageSize=
export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const filters = productQuerySchema.parse(params);
    const result = await listProducts(filters);
    return ok(result);
  } catch (err) {
    return fail(err);
  }
}
