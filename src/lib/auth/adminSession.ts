import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppError, UnauthorizedError } from "@/lib/errors";

/**
 * Lightweight admin authentication.
 *
 * The rest of the app (the storefront) intentionally ships without a full
 * auth system — see lib/utils/session.ts. The admin dashboard is different:
 * it can create/edit/delete real data, so it's gated behind a single shared
 * admin password (set via the ADMIN_PASSWORD env var, never committed) and a
 * signed, expiring session cookie.
 *
 * This is deliberately simple rather than a full identity provider — one
 * admin credential, no roles/permissions — which fits a single-admin
 * portfolio/capstone project. See README "Known limitations" for how this
 * would be swapped for Cognito/NextAuth/etc. with per-admin accounts and
 * RBAC in a real production deployment.
 *
 * Session token shape: `${expiresAtMs}.${hmacHex}`, where hmacHex is an
 * HMAC-SHA256 of expiresAtMs keyed by ADMIN_SESSION_SECRET. This is
 * stateless (no session table) and tamper-evident: flipping the expiry
 * without knowing the secret invalidates the signature.
 */

const COOKIE_NAME = "verve_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new AppError(
      "Admin auth is not configured. Set ADMIN_SESSION_SECRET in your environment.",
      500,
      "ADMIN_NOT_CONFIGURED"
    );
  }
  return secret;
}

function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new AppError(
      "Admin auth is not configured. Set ADMIN_PASSWORD in your environment.",
      500,
      "ADMIN_NOT_CONFIGURED"
    );
  }
  return password;
}

function sign(payload: string): string {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function createSessionToken(): string {
  const expiresAtMs = String(Date.now() + SESSION_TTL_MS);
  return `${expiresAtMs}.${sign(expiresAtMs)}`;
}

function isValidToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expiresAtMs, signature] = token.split(".");
  if (!expiresAtMs || !signature) return false;
  if (!safeEqual(sign(expiresAtMs), signature)) return false;
  return Number(expiresAtMs) > Date.now();
}

/** Verifies a submitted password against ADMIN_PASSWORD using a
 *  constant-time comparison (so response timing can't leak how many
 *  leading characters matched). */
export function verifyAdminPassword(candidate: string): boolean {
  const expected = getAdminPassword();
  // Pad to equal length before comparing so safeEqual's length check itself
  // doesn't leak the real password's length; a wrong-length guess still
  // simply fails.
  if (candidate.length !== expected.length) return false;
  return safeEqual(candidate, expected);
}

/** Call from a Route Handler after a successful password check to start a
 *  session — sets an httpOnly, signed, expiring cookie. */
export function createAdminSession(): void {
  cookies().set(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
}

/** Call from a Route Handler to end the current admin session. */
export function destroyAdminSession(): void {
  cookies().delete(COOKIE_NAME);
}

/** True if the current request carries a valid, unexpired admin session. */
export function hasAdminSession(): boolean {
  const token = cookies().get(COOKIE_NAME)?.value;
  return isValidToken(token);
}

/** Guard for admin API routes: throws UnauthorizedError (→ 401 via the
 *  shared fail() handler) when there's no valid admin session. Call this
 *  first, inside the route's try/catch, before touching any data. */
export function requireAdminApi(): void {
  if (!hasAdminSession()) {
    throw new UnauthorizedError();
  }
}

/** Guard for admin pages (Server Components): redirects to the login page
 *  when there's no valid admin session. Called once, from the protected
 *  dashboard layout, so every nested admin page is covered automatically. */
export function requireAdminPage(): void {
  if (!hasAdminSession()) {
    redirect("/admin/login");
  }
}
