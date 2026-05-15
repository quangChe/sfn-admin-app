# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Internal admin dashboard aggregating Shopify (orders, products, customers, media, analytics) and Google Workspace (Sheets, Drive, Gmail, Calendar) into a single interface. No database — all data is fetched from external APIs.

## Commands

- `npm run dev` — Start dev server (localhost:3000)
- `npm run build` — Production build
- `npm run lint` — Run ESLint (flat config, ESLint 9)
- `npm test` — Vitest unit/component tests (watch mode)
- `npm run test:coverage` — Coverage report
- `npm run test:e2e` — Playwright E2E tests (requires dev server or starts it automatically)
- `npx shadcn@latest add <component>` — Add a shadcn/ui component
- `npm run db:generate` — Generate Drizzle migration from schema changes
- `npm run db:migrate` — Apply pending migrations to Neon
- `npm run db:seed` — Seed default roles + permissions (requires .env.local)
- `npm run db:studio` — Open Drizzle Studio (DB browser)

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5** (strict mode)
- **better-auth** (Google OAuth, Drizzle adapter, `@fashionica.com` allowlist)
- **Neon Postgres** + **Drizzle ORM** (schema in `src/lib/db/schema/`)
- **Pusher Channels** (server: `pusher`, client: `pusher-js`) — infrastructure only in Phase 1
- **Shopify Admin API** via `@shopify/admin-api-client` (GraphQL)
- **Google APIs** via `googleapis` (OAuth2 per-session tokens)
- **Tailwind CSS v4** + **shadcn/ui** (New York style) + **Lucide** icons
- **Recharts** for charts, **Sonner** for toasts, **Zod** for validation

## Architecture

### Route Groups

- `src/app/(auth)/` — Public routes (login page)
- `src/app/(dashboard)/` — Protected routes with shared Sidebar+Header layout
- `src/app/api/shopify/` — Shopify proxy API routes
- `src/app/api/google/` — Google proxy API routes

### Data Flow Pattern

Dashboard pages are **server components** that fetch data directly from Shopify/Google APIs, then pass data to **client components** for interactivity (tables, charts). API routes exist for client-side fetches and follow the pattern: check `auth()` session → validate params → call external API → return JSON.

### Shopify Integration

- Singleton client in `src/lib/shopify/client.ts`
- GraphQL queries in `src/lib/shopify/queries/*.ts` (orders, products, customers, analytics, media)
- API routes in `src/app/api/shopify/*/route.ts`

### Google Integration

- OAuth2 client in `src/lib/google/oauth-client.ts` — creates per-request clients from session tokens
- Service clients: `sheets.ts`, `drive.ts`, `gmail.ts`, `calendar.ts` in `src/lib/google/`
- API routes in `src/app/api/google/*/route.ts`

### Auth & Middleware

- `src/lib/auth/index.ts` — better-auth server config (Google provider, Drizzle adapter, email allowlist). Exports `auth` and `getSession(headers)` (the enriched session helper that loads permissions from RBAC tables).
- `src/lib/auth/client.ts` — better-auth React client (`useSession`, `signIn`, `signOut`). Import here, not from `better-auth/react` directly.
- `src/lib/auth/permissions.ts` — `hasPermission(session, key)` and `requirePermission(session, key)`.
- `src/proxy.ts` — Cookie-presence check via `getSessionCookie` from `better-auth/cookies` (no DB round-trip on edge). Server components re-validate via `getSession(await headers())`.

**Server session reads** (in server components or route handlers):
```ts
import { getSession } from "@/lib/auth";
import { headers } from "next/headers";
const session = await getSession(await headers());
```

### Environment Variables

Validated via Zod in `src/lib/env.ts` (lazy proxy pattern). Required: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_ADMIN_ACCESS_TOKEN`, `SHOPIFY_API_VERSION`, `DATABASE_URL`, `BETTER_AUTH_URL`, `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`, `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`. See `.env.local.example`.

**Note:** `src/lib/db/index.ts` and `src/lib/auth/index.ts` access `process.env` directly (not via `env.ts`) so that `next build` succeeds before credentials are configured. All other code uses the validated `env` proxy.

## Database

- **Stack:** Neon Postgres + Drizzle ORM, connected via `@neondatabase/serverless` HTTP driver.
- **Schema:** `src/lib/db/schema/` — one file per domain (`users`, `rbac`, `drops`, `audit`).
- **Migration workflow:** Edit schema → `npm run db:generate` → commit the generated file in `drizzle/migrations/` → `npm run db:migrate` to apply.
- **All queries via Drizzle** — never raw SQL.
- **`change_log` is append-only** — no update or delete operations against that table, ever.

## Event Emission

Every state change that matters calls `emitEvent(name, payload)` from `src/lib/events/emit.ts`.

- Currently writes one append-only row to `change_log`.
- Future integrations (Inngest job trigger, Slack notification, Pusher broadcast) hook into this helper — not into individual save routes.
- Every save route MUST call `emitEvent(...)` even if no subscribers exist yet.

## Conventions

- Path alias: `@/*` maps to `src/*`
- `cn()` utility from `src/lib/utils.ts` for merging Tailwind classes
- Shopify types in `src/types/shopify.ts`, Google types in `src/types/google.ts`
- Navigation items configured in `src/components/layout/nav-items.ts`
- Remote images allowed from `cdn.shopify.com`, `*.shopifycdn.com`, `lh3.googleusercontent.com` (configured in `next.config.ts`)

## Drop Management System

FashioNica runs weekly product drops. Products are assigned to a drop by tagging them
in Shopify with a date string in `M.D.YY` format (e.g. `5.1.26`, `5.15.26`).

- **The tag IS the data model.** No database. No metafields for drop assignment.
- Parse tags with utilities in `src/lib/drops/parse-tag.ts` — never roll ad-hoc parsing.
- Full spec, file layout, query patterns, invariants: @.claude/rules/drops.md

### New routes (add to sidebar nav-items.ts):

- `src/app/(dashboard)/drops/page.tsx` — Drop Calendar (server component)
- `src/app/(dashboard)/drops/[tag]/layout.tsx` — Drop Workspace shell (client component)
- `src/app/(dashboard)/drops/[tag]/pricing/page.tsx` — and copy, specs, media, channels

### New API routes:

- `src/app/api/shopify/drops/route.ts` — GET all drops for calendar
- `src/app/api/shopify/drops/[tag]/route.ts` — GET products in a drop
- `src/app/api/shopify/drops/[tag]/bulk/route.ts` — PATCH bulk field updates
- `src/app/api/ai/price-suggest/route.ts` — POST AI pricing suggestions (uses Anthropic API + web_search)

### New components:

- `src/components/drops/` — all drop UI lives here (calendar, workspace, tabs, bulk table)
- `src/lib/drops/` — tag parsing, GraphQL queries/mutations for drops
- `src/types/drops.ts` — Drop, DropProduct, WorkflowTab, DropStatus types

## Testing

- Run `npm test` before marking any drops-related task complete
- Run `npm run test:e2e` before marking a full page build complete
- All pure functions in `src/lib/drops/` must maintain 100% test coverage

## Current Phase

I am the sole engineer on this project, working with Claude Code.
We are building Phase 1 of an internal operations platform for FashioNica.

### Phase 1 scope

- Postgres + Drizzle + better-auth + Pusher infrastructure
- Audit logging via change_log table
- Event emission pattern for every state change
- Drop Calendar page
- Drop Status Board page
- Drop Workspace with fully working Pricing tab + stub tabs for Copy/Specs/Media/Channels

### Not in scope (defer to Phase 2+)

- Shopify-to-DB inversion (Shopify stays source of truth for product data)
- Background job workers (no Inngest yet)
- Multichannel sync automation
- Vendor portal, service inbox, marketing attribution
- Real-time presence wired into pages (infrastructure only)

### Working principles

- Optimize for Phase 1 scope while leaving doors open for Phase 2+
- Reject suggestions to expand scope mid-session
- Every state change in save routes calls emitEvent(...) — even if no subscribers exist yet
- Shopify is source of truth for product/order data
- Database is source of truth for operational metadata: sign-offs, audit log, users, roles, dismissed alerts
- All DB queries via Drizzle, never raw SQL
- Permissions checked via better-auth session.user.permissions
