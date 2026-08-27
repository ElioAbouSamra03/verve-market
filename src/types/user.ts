/**
 * User domain types.
 *
 * DynamoDB table: verve_users
 * PK: USER#<userId>   SK: PROFILE
 * GSI1 (lookup by email): GSI1PK: EMAIL#<email>   GSI1SK: PROFILE
 *
 * NOTE: this project intentionally ships without a full auth system (that is
 * a separate concern from "e-commerce data modeling"). A stable `userId` is
 * expected to come from a cookie/session or an auth provider (e.g. NextAuth,
 * Cognito) — see README "Authentication" section for the production plan.
 * For local development, `lib/utils/session.ts` issues a persisted guest id.
 */

export interface User {
  userId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  addresses?: Address[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  label: string; // "Home", "Work"
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface CreateUserInput {
  email: string;
  name: string;
}
