# Workspace

## Overview

Server parts warehouse management system (Складской учёт запчастей для серверов).
pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui
- **Charts**: Recharts
- **Icons**: lucide-react

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── warehouse/          # React frontend (warehouse management UI)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/seed.ts         # Database seeding script
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes:
  - `health.ts` — GET /healthz
  - `categories.ts` — GET/POST/DELETE /categories
  - `suppliers.ts` — GET/POST/PUT/DELETE /suppliers
  - `warehouses.ts` — GET/POST/DELETE /warehouses
  - `parts.ts` — GET/POST/GET/:id/PUT/:id/DELETE/:id /parts (with search/filter)
  - `transactions.ts` — GET/POST /transactions (with automatic stock update)
  - `dashboard.ts` — GET /dashboard/stats
- Depends on: `@workspace/db`, `@workspace/api-zod`

### `artifacts/warehouse` (`@workspace/warehouse`)

React + Vite frontend, mounted at `/`. Pages:
- Dashboard — statistics, recent transactions, top categories chart
- Parts Catalog (`/parts`) — table with CRUD, search, filters
- Transactions (`/transactions`) — journal with filtering
- Categories, Suppliers, Warehouses — supporting entity management

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Schema:
- `categories` — part categories
- `suppliers` — supplier companies
- `warehouses` — storage locations
- `parts` — parts catalog (with quantity tracking)
- `transactions` — inventory movements (receipt/issue/adjustment/transfer)

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec. Codegen: `pnpm --filter @workspace/api-spec run codegen`

### `scripts` (`@workspace/scripts`)

- `pnpm --filter @workspace/scripts run seed` — seed demo data

## Known Issues / Notes

- `History` from lucide-react conflicts with browser native `History`. Always import as `History as HistoryIcon`.
- When importing types from `@workspace/api-client-react`, use the package root (`from "@workspace/api-client-react"`), not deep paths.

## Production Migrations

In development: `pnpm --filter @workspace/db run push`
In production: handled automatically by Replit on deployment.
