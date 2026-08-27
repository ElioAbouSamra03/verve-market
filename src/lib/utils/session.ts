import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const GUEST_COOKIE = "verve_uid";

/**
 * Returns a stable identifier for the current visitor.
 *
 * This app ships without a full authentication system so the reviewer can
 * focus on data modeling and business logic (see README). In production,
 * this function would instead read the verified user id out of a session
 * (NextAuth, Cognito, custom JWT, etc.). Every cart/wishlist DB call is
 * already written against a plain `userId: string`, so swapping this
 * function out is the only change needed to plug in real auth.
 */
export function getOrCreateUserId(): string {
  const store = cookies();
  const existing = store.get(GUEST_COOKIE)?.value;
  if (existing) return existing;

  const id = `guest_${randomUUID()}`;
  store.set(GUEST_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return id;
}
