# Verve Market

A production-style, full-stack e-commerce platform built as a software engineering
capstone project. It focuses on **architecture, data modeling, and business logic** as
much as UI — every mutation runs through validation, a documented DynamoDB schema, and
a consistent error-handling layer.

**Stack:** Next.js 14 (App Router) · React · TypeScript · Tailwind CSS · AWS DynamoDB

### Two sites, one codebase

This repository builds **two separate websites** from one Next.js app and one shared
DynamoDB backend:

| | Route | Who it's for | What it does |
|---|---|---|---|
| **Storefront** | `/` | Shoppers (public, no login) | Browse categories, search/filter/sort products, view product details, manage a cart and wishlist. |
| **Admin dashboard** | `/admin` | Store administrators (password-protected) | Run the store — manage products, categories, and users; view stats, carts, and wishlists across every shopper. See [Admin dashboard](#admin-dashboard) for setup and details. |

They share the same product/category/user/cart/wishlist data in DynamoDB — the admin
dashboard is a management layer on top of the same tables the storefront reads and
writes, not a separate app or database.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [DynamoDB design](#dynamodb-design)
- [API reference](#api-reference)
- [Admin dashboard](#admin-dashboard)
- [Environment variables](#environment-variables)
- [Installation](#installation)
- [Known limitations / production roadmap](#known-limitations--production-roadmap)

---

## Features

**Storefront**
- Responsive homepage with featured categories and featured products
- Category landing pages
- Product listing with search, category filter, price range, and sort
- Product detail pages with variants, related products, and stock-aware add-to-cart
- Pagination

**Cart & wishlist**
- Add to cart with quantity and variant selection
- Update quantity / remove line items, subtotal calculated server-side
- Wishlist add/remove with duplicate prevention enforced at the database layer
- Cart merges duplicate additions into a single line item instead of creating a second one

**Application experience**
- Loading skeletons, empty states, and error states with retry, on every data view
- Route-level error boundaries (`error.tsx`) and a global 404 page (`not-found.tsx`)
- Server-side input validation (Zod) on every mutating endpoint, with 422 responses
- Mobile / tablet / desktop responsive layout throughout

**Admin dashboard** (`/admin`, password-protected — see [Admin dashboard](#admin-dashboard))
- Overview: total users/products/categories, cart & wishlist item counts, low-stock and
  recently-added product lists
- Products: create, view, edit, delete, and a quick inline stock updater
- Categories: create, view, edit, delete (blocked while products still reference it)
- Users: view, search, edit profile, delete (cascades their cart + wishlist)
- Cart & wishlist: view every line item across every user, remove individual entries
- Search/filter/sort/pagination on every list, confirmation dialogs before destructive
  actions, and the same loading/empty/error-state discipline as the storefront

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Colocates UI, API route handlers, and server components in one project |
| Language | TypeScript (strict mode) | Compile-time safety across the API/DB boundary |
| Styling | Tailwind CSS | Fast, consistent design-token-driven styling |
| Database | AWS DynamoDB | Serverless, scales to zero, pay-per-request billing fits a demo/portfolio project |
| Validation | Zod | Schema validation + inferred TypeScript types from one source of truth |
| SDK | `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb` | Official AWS SDK v3, document client for ergonomic JSON reads/writes |

---

## Architecture

```
Browser (React components)
      │  fetch() via src/lib/apiClient.ts
      ▼
Next.js Route Handlers  (src/app/api/**/route.ts, src/app/api/admin/**/route.ts)
      │  Zod validation → admin session check (admin routes only) → business logic
      ▼
Data access layer        (src/lib/db/*.ts)
      │  AWS SDK v3 DynamoDBDocumentClient
      ▼
AWS DynamoDB
```

Server Components (`page.tsx` files for the homepage, product listing, product detail,
category pages, and the admin dashboard home) call the data-access layer **directly** —
they don't round-trip through the app's own HTTP API, since they already run on the
server. Client-side mutations (storefront: add to cart, toggle wishlist, update
quantity; admin: every create/edit/delete screen) go through the API routes, because
they originate in the browser and need request validation, session/auth resolution,
and a JSON response contract. The admin dashboard reuses this exact same layered
architecture end to end (`Admin Dashboard → API/Server Layer → AWS DynamoDB`) — it
adds a session check in front of the same route-handler → data-access-layer pipeline
the storefront already uses, rather than a separate stack.

**Separation of concerns**

| Concern | Location |
|---|---|
| UI components | `src/components/**` |
| Pages / routing | `src/app/**/page.tsx` |
| API / server functionality | `src/app/api/**/route.ts` |
| Business logic + database operations | `src/lib/db/*.ts` |
| Input validation | `src/lib/validation/schemas.ts` |
| Error taxonomy | `src/lib/errors.ts` |
| Types & interfaces | `src/types/*.ts` |
| Utility functions | `src/lib/utils/*.ts` |
| Client-side global state | `src/context/*.tsx` |

**Error handling.** Every route handler wraps its logic in try/catch and funnels the
result through `ok()/created()/noContent()` (success) or `fail()` (error) from
`src/lib/utils/apiResponse.ts`. `fail()` recognizes `ZodError` (→ 422), the app's own
`AppError` subclasses (`NotFoundError` → 404, `ConflictError` → 409, `OutOfStockError` →
409, `DatabaseError` → 502), and falls back to a generic 500 for anything unexpected —
so raw AWS SDK errors or stack traces never reach the client.

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                    # Homepage
│   ├── layout.tsx                  # Root layout: fonts, providers, header/footer
│   ├── loading.tsx / not-found.tsx # Global loading + 404
│   ├── products/
│   │   ├── page.tsx                # Listing: search, filter, sort, pagination
│   │   ├── error.tsx               # Route-level error boundary
│   │   └── [id]/page.tsx           # Product detail (param is the product slug)
│   ├── categories/[slug]/page.tsx  # Category landing page
│   ├── cart/page.tsx               # Cart (client component, uses CartContext)
│   ├── wishlist/page.tsx           # Wishlist (client component)
│   ├── admin/                      # Admin dashboard — see "Admin dashboard" below
│   │   ├── layout.tsx              # Root admin layout (ToastProvider, metadata)
│   │   ├── login/page.tsx          # Admin password login
│   │   └── (dashboard)/            # Route group: every protected admin screen
│   │       ├── layout.tsx          # Session guard + sidebar/topbar shell
│   │       ├── page.tsx            # Dashboard home (stats)
│   │       ├── products/           # list, new/, [id]/ (edit)
│   │       ├── categories/         # list, new/, [slug]/ (edit)
│   │       ├── users/              # list, [id]/ (view/edit/delete)
│   │       ├── cart/page.tsx       # All cart items, across all users
│   │       └── wishlist/page.tsx   # All wishlist items, across all users
│   └── api/
│       ├── products/route.ts, products/[id]/route.ts
│       ├── categories/route.ts
│       ├── cart/route.ts, cart/[id]/route.ts
│       ├── wishlist/route.ts, wishlist/[id]/route.ts
│       ├── users/route.ts
│       └── admin/                  # Session-gated admin API (see below)
│           ├── auth/login/route.ts, auth/logout/route.ts
│           ├── stats/route.ts
│           ├── products/route.ts, products/[id]/route.ts, products/[id]/stock/route.ts
│           ├── categories/route.ts, categories/[slug]/route.ts
│           ├── users/route.ts, users/[id]/route.ts
│           ├── cart/route.ts, cart/[userId]/[productId]/route.ts
│           └── wishlist/route.ts, wishlist/[userId]/[productId]/route.ts
├── components/
│   ├── layout/     (Header, Footer)
│   ├── product/    (ProductCard, ProductGrid, AddToCartForm, RelatedProducts)
│   ├── cart/       (CartLineItem)
│   ├── wishlist/   (WishlistCard)
│   ├── search/     (FilterSidebar, Pagination)
│   ├── ui/         (Button, EmptyState, ErrorState, Loading, Price)
│   └── admin/      (AdminSidebar, AdminTopbar, AdminTable, StatCard, Badge,
│                     ConfirmDialog, ToastProvider, SearchInput, AdminPagination,
│                     FormField inputs, ProductForm, CategoryForm)
├── context/         # CartContext, WishlistContext — client-side global state
├── lib/
│   ├── db/          # DynamoDB access layer: products, categories, cart, wishlist,
│   │                #   users, adminStats (dashboard aggregation)
│   ├── auth/        # adminSession (signed cookie), loginRateLimit
│   ├── validation/  # Zod schemas (schemas.ts, adminSchemas.ts)
│   ├── utils/       # apiResponse, session (guest id), format
│   ├── apiClient.ts # fetch wrapper used by React contexts and the admin UI
│   └── errors.ts    # AppError hierarchy
├── types/           # Product, Category, CartItem, WishlistItem, User, admin (DashboardStats)
└── data/seedData.ts # Sample catalog used by scripts/seed.ts

scripts/
├── createTables.ts  # Creates DynamoDB tables + GSIs (idempotent)
└── seed.ts          # Populates sample categories/products
```

---

## DynamoDB design

Five tables, each single-table-per-entity (not one shared mega-table, to keep the
schema easy to follow for review purposes). Every table uses **on-demand billing**
(`PAY_PER_REQUEST`) so cost scales to zero.

### `verve_products`
| | |
|---|---|
| PK | `PRODUCT#<productId>` |
| SK | `METADATA` |
| GSI1 | `GSI1PK = CATEGORY#<categorySlug>`, `GSI1SK = PRODUCT#<productId>` — powers "browse by category" without a table scan |

Reads: `GetItem` by id, `Query` on GSI1 for category browsing, `Scan` (paginated) for
free-text search across the whole catalog. Writes: `PutItem` (create/replace),
`UpdateItem` with a `ConditionExpression` (`stock >= :qty`) to decrement stock safely.

> **Why Scan for search?** DynamoDB has no native full-text search. Scanning the whole
> table and filtering in memory is fine at demo scale (dozens–low thousands of items)
> and keeps the project self-contained. See [Known limitations](#known-limitations--production-roadmap)
> for the production alternative (DynamoDB Streams → OpenSearch/Algolia).

### `verve_categories`
| | |
|---|---|
| PK | `CATEGORY#<slug>` |
| SK | `METADATA` |

Simple key-value lookup; the catalog is small enough that `listCategories()` scans
the whole table and sorts client-side.

### `verve_cart`
| | |
|---|---|
| PK | `USER#<userId>` |
| SK | `ITEM#<productId>#<variantId or "base">` |

Each cart line item is its own DynamoDB item (not one JSON blob per user) so quantity
updates and removals are single, cheap, **conditional** writes instead of a
read-modify-write race between two open tabs. `getCart()` runs one `Query` on the
partition key and computes `itemCount`/`subtotalCents` in the data-access layer.
Prices are **denormalized** into a `productSnapshot` at add-time, so historical cart
totals don't silently change if a product's price is edited later.

### `verve_wishlist`
| | |
|---|---|
| PK | `USER#<userId>` |
| SK | `PRODUCT#<productId>` |

Duplicate prevention uses a conditional `PutItem`
(`ConditionExpression: attribute_not_exists(PK)`) rather than "check, then write" —
this closes the race condition a naive approach has under concurrent requests (double
click, two open tabs) and surfaces as a clean `409 CONFLICT` from the API.

### `verve_users`
| | |
|---|---|
| PK | `USER#<userId>` |
| SK | `PROFILE` |
| GSI1 | `GSI1PK = EMAIL#<email>`, `GSI1SK = PROFILE` — enforces "one account per email" via lookup-before-create |

---

## API reference

Every response is a consistent JSON envelope:
```json
{ "success": true, "data": { /* ... */ } }
{ "success": false, "error": { "code": "OUT_OF_STOCK", "message": "...", "details": {} } }
```

| Method & path | Description | Validated body |
|---|---|---|
| `GET /api/products?category=&q=&minPrice=&maxPrice=&sort=&page=&pageSize=` | Search/filter/sort/paginate the catalog | query params |
| `GET /api/products/:id` | Product detail + related products | — |
| `GET /api/categories` | List all categories | — |
| `GET /api/cart` | Current user's cart + computed subtotal | — |
| `POST /api/cart` | Add item (merges into existing line item) | `{ productId, quantity, variantId? }` |
| `PATCH /api/cart/:productId?variantId=` | Update line item quantity | `{ quantity }` |
| `DELETE /api/cart/:productId?variantId=` | Remove one line item | — |
| `DELETE /api/cart` | Empty the cart | — |
| `GET /api/wishlist` | List wishlist items | — |
| `POST /api/wishlist` | Add product (409 if already present) | `{ productId }` |
| `DELETE /api/wishlist/:productId` | Remove item | — |
| `POST /api/users` | Create a user profile (409 on duplicate email) | `{ email, name }` |

The "current user" for cart/wishlist is resolved by `src/lib/utils/session.ts`, which
issues and persists a `guest_<uuid>` in an httpOnly cookie. See
[Known limitations](#known-limitations--production-roadmap) for how this plugs into
real authentication.

---

## Admin dashboard

A password-protected management interface at `/admin` for running the store —
everything in [Features](#features) above, backed by the exact same
`API/Server layer → DynamoDB` pipeline the storefront uses (see
[Architecture](#architecture)).

### Auth model

The storefront ships without a full auth system on purpose (see
[Known limitations](#known-limitations--production-roadmap)); the admin dashboard is
the one place in this app that can mutate real data, so it's gated behind:

- **`ADMIN_PASSWORD`** — a single shared password, set via an env var and never
  committed. Compared with a constant-time check (`crypto.timingSafeEqual`) so
  response timing can't leak a partial match.
- **A signed, expiring session cookie** (`src/lib/auth/adminSession.ts`) — stateless,
  HMAC-SHA256-signed with `ADMIN_SESSION_SECRET`, 8-hour expiry, `httpOnly` +
  `sameSite: lax`. No session table to manage; tampering with the cookie invalidates
  the signature.
- **A basic in-memory login rate limiter** (`src/lib/auth/loginRateLimit.ts`) — 5
  attempts per minute per IP.
- **One guard, two call sites**: `requireAdminPage()` runs once in
  `src/app/admin/(dashboard)/layout.tsx` and protects every nested admin page (a
  missing/expired session redirects to `/admin/login`); `requireAdminApi()` runs at
  the top of every `src/app/api/admin/**/route.ts` handler and throws
  `UnauthorizedError` (→ 401) otherwise.

This is intentionally simple — one shared credential, no per-admin accounts or roles
— which fits a single-admin capstone/portfolio project. A real multi-admin deployment
would swap this for Cognito, NextAuth, or a similar provider with per-admin accounts
and RBAC; because every admin route already funnels through `requireAdminApi()` /
`requireAdminPage()`, that swap touches those two functions, not every route handler.

### Data-integrity rules enforced by the admin API

- **Category deletion is blocked (409)** while any product still references it —
  reassign or delete those products first (`lib/db/categories.ts#deleteCategory`).
- **Renaming a category cascades** the new display name onto every product's
  denormalized `categoryName` field (`lib/db/categories.ts#updateCategory`), so
  listings never go stale.
- **`Category.productCount` is recomputed** from the live product table after every
  admin create/update/delete of a product (`syncCategoryProductCount`), rather than
  trusted as a hand-maintained counter.
- **Deleting a user cascades** to clear their cart and wishlist first
  (`src/app/api/admin/users/[id]/route.ts`), so no rows are left pointing at a
  `userId` that no longer exists.
- **Product/category slugs are checked for uniqueness** on create and on rename,
  returning a 409 `CONFLICT` instead of silently overwriting another record.

### Admin API reference

All admin routes live under `/api/admin/**`, require a valid admin session, and use
the same `{ success, data }` / `{ success: false, error }` envelope as the public API.

| Method & path | Description |
|---|---|
| `POST /api/admin/auth/login` | `{ password }` → sets the admin session cookie |
| `POST /api/admin/auth/logout` | Clears the admin session cookie |
| `GET /api/admin/stats` | Dashboard counters + low-stock/recent-product lists |
| `GET /api/admin/products?category=&q=&lowStockOnly=&sort=&page=&pageSize=` | Admin product listing (full records, not the trimmed storefront summary) |
| `POST /api/admin/products` | Create a product |
| `GET /api/admin/products/:id` / `PATCH` / `DELETE` | Read, partially update, or delete one product |
| `PATCH /api/admin/products/:id/stock` | `{ stock }` — quick absolute inventory update |
| `GET /api/admin/categories` / `POST` | List / create categories |
| `GET /api/admin/categories/:slug` / `PATCH` / `DELETE` | Read, update, or delete one category |
| `GET /api/admin/users?q=&page=&pageSize=` | Search/paginate users |
| `GET /api/admin/users/:id` / `PATCH` / `DELETE` | Read, update, or delete (cascades) one user |
| `GET /api/admin/cart` | Every cart line item, across every user |
| `DELETE /api/admin/cart/:userId/:productId?variantId=` | Remove one cart line item |
| `GET /api/admin/wishlist` | Every wishlist entry, across every user |
| `DELETE /api/admin/wishlist/:userId/:productId` | Remove one wishlist entry |

### Running it locally

1. Add to `.env.local` (see [Environment variables](#environment-variables)):
   ```bash
   ADMIN_PASSWORD=pick_a_password
   ADMIN_SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   ```
2. `npm run dev`, then open `http://localhost:3000/admin` and sign in.

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in real values:

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# Optional — point at DynamoDB Local for offline development instead of real AWS
DYNAMODB_ENDPOINT=http://localhost:8000

DYNAMODB_TABLE_USERS=verve_users
DYNAMODB_TABLE_PRODUCTS=verve_products
DYNAMODB_TABLE_CATEGORIES=verve_categories
DYNAMODB_TABLE_CART=verve_cart
DYNAMODB_TABLE_WISHLIST=verve_wishlist

NEXT_PUBLIC_APP_NAME="Verve Market"

# Admin dashboard (see "Admin dashboard" above)
ADMIN_PASSWORD=your_admin_password
ADMIN_SESSION_SECRET=a_long_random_string
```

Credentials are never hardcoded anywhere in the codebase — the DynamoDB client
(`src/lib/db/dynamoClient.ts`) reads them from `process.env` and otherwise falls back
to the standard AWS credential provider chain (IAM role, shared config, etc.), which
is what a real deployment (Lambda, ECS, Amplify) would use instead of static keys.

---

## Installation

### 1. Prerequisites
- Node.js 18+
- An AWS account with DynamoDB access **or** [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html) for offline dev (`docker run -p 8000:8000 amazon/dynamodb-local`)

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env.local
# then edit .env.local with your AWS credentials or leave DYNAMODB_ENDPOINT set
# for local DynamoDB
```

### 4. Create tables and seed sample data
```bash
npx tsx scripts/createTables.ts
npm run seed
```

### 5. Run the app
```bash
npm run dev
# storefront: http://localhost:3000
# admin dashboard: http://localhost:3000/admin (needs ADMIN_PASSWORD/ADMIN_SESSION_SECRET set)
```

### Other scripts
```bash
npm run build        # production build
npm run start         # run the production build
npm run lint          # ESLint
npm run type-check    # tsc --noEmit
```

---

## Known limitations / production roadmap

This project is scoped to demonstrate architecture and data modeling, not to be a
finished commercial platform. Documented trade-offs:

- **Authentication.** Cart/wishlist ownership is resolved by a guest cookie
  (`lib/utils/session.ts`), not a full login system. Every DB function already takes
  a plain `userId: string`, so swapping in real auth (NextAuth, Cognito, custom JWT)
  only requires changing that one function.
- **Search.** Free-text search scans the products table and filters in memory
  (see [DynamoDB design](#dynamodb-design)). At real scale this would move to
  DynamoDB Streams feeding OpenSearch or Algolia for faceted, ranked search.
- **Checkout/payments.** The cart supports subtotal calculation but there's no
  payment integration (Stripe, etc.) or order-history table — "Proceed to checkout"
  is a clearly-marked stub for a future milestone.
- **Product image storage.** Images are served from Unsplash URLs for demo purposes;
  a production version would use S3 + CloudFront.
- **Admin auth is single-credential, not multi-admin/RBAC.** One shared
  `ADMIN_PASSWORD` and a signed session cookie (see
  [Admin dashboard](#admin-dashboard)) rather than per-admin accounts, roles, or
  permissions. A production deployment would swap in Cognito/NextAuth/an identity
  provider — the two guard functions (`requireAdminPage`/`requireAdminApi`) are the
  only integration points that would need to change.
- **Admin login rate limiting is in-memory**, not distributed — it resets on restart
  and isn't shared across instances. Fine for a single-instance deployment; a
  multi-instance one would move this to DynamoDB (a TTL'd attempts table) or a
  managed WAF rate-limit rule.
- **Dashboard stats are computed on read**, not maintained as running counters —
  every `/admin` page load runs a handful of table scans (see
  `lib/db/adminStats.ts`). Fine at demo scale; a production version would maintain
  these via DynamoDB Streams instead of recomputing them per request.
- **Product variant management isn't in the admin UI.** The admin product form
  covers name/description/price/images/tags/stock/category/featured; a product's
  existing `variants` array (see `types/product.ts`) is preserved on edit but not
  editable from `/admin` yet.
