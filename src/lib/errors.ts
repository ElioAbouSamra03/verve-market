/**
 * Central error taxonomy for the app.
 *
 * Route handlers catch these and translate them into consistent JSON error
 * responses (see lib/utils/apiResponse.ts) instead of leaking raw AWS SDK
 * errors or stack traces to the client.
 */

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR", details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} "${id}" was not found.` : `${resource} was not found.`,
      404,
      "NOT_FOUND"
    );
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 422, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
    this.name = "ConflictError";
  }
}

export class OutOfStockError extends AppError {
  constructor(productName: string, available: number) {
    super(
      `"${productName}" only has ${available} unit(s) left in stock.`,
      409,
      "OUT_OF_STOCK",
      { available }
    );
    this.name = "OutOfStockError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "You must be signed in as an admin to do that.") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class RateLimitedError extends AppError {
  constructor(message = "Too many attempts. Please wait and try again.") {
    super(message, 429, "RATE_LIMITED");
    this.name = "RateLimitedError";
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, 502, "DATABASE_ERROR");
    this.name = "DatabaseError";
    if (cause instanceof Error) this.stack += `\nCaused by: ${cause.stack}`;
  }
}
