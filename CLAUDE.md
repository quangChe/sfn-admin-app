# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Internal admin dashboard aggregating Shopify (orders, products, customers, media, analytics) and Google Workspace (Sheets, Drive, Gmail, Calendar) into a single interface. No database — all data is fetched from external APIs.

## Commands

- `npm run dev` — Start dev server (localhost:3000)
- `npm run build` — Production build
- `npm run lint` — Run ESLint (flat config, ESLint 9)
- `npx shadcn@latest add <component>` — Add a shadcn/ui component

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5** (strict mode)
- **NextAuth v5 beta** (Google OAuth with offline refresh tokens)
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

- `src/auth.ts` — NextAuth config with Google provider, JWT token refresh logic, extended session types
- `middleware.ts` — Protects all routes except `/login` and `/api/auth`; redirects with callback URL; forces re-auth on `RefreshTokenError`
- Session type extensions in `src/types/next-auth.d.ts`

### Environment Variables

Validated via Zod in `src/lib/env.ts` (lazy proxy pattern). Required: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_ADMIN_ACCESS_TOKEN`, `SHOPIFY_API_VERSION`. See `.env.local.example`.

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
