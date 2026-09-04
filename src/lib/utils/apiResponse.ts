import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { ZodError } from "zod";

/**
 * Every API route funnels its success/error output through these two
 * helpers so the frontend can always rely on the same envelope shape:
 *   { success: true,  data: T }
 *   { success: false, error: { code, message, details? } }
 */

export function ok<T>(data: T, init?: number | ResponseInit) {
  const responseInit = typeof init === "number" ? { status: init } : init;
  return NextResponse.json({ success: true, data }, { status: 200, ...responseInit });
}

export function created<T>(data: T) {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function fail(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "One or more fields are invalid.",
          details: error.flatten(),
        },
      },
      { status: 422 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: { code: error.code, message: error.message, details: error.details },
      },
      { status: error.statusCode }
    );
  }

  // Unknown/unexpected error — never leak internals to the client.
  console.error("Unhandled API error:", error);
  return NextResponse.json(
    {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
    },
    { status: 500 }
  );
}
