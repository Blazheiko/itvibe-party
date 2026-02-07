# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack monorepo for a productivity/chat application (contacts, messaging, notes, calendar, tasks, projects, WebRTC calls, push notifications). Uses pnpm workspaces with four packages: `backend`, `frontend`, `shared`, and `api-playground`.

## Tech Stack

- **Backend:** uWebSockets.js server, TypeScript, Drizzle ORM (MySQL), Redis (ioredis), ArkType validation, Pino logging, ts-pattern
- **Frontend:** Vue 3 (Composition API + `<script setup>`), Pinia, Vue Router, Vite
- **Shared:** ArkType branded types, schemas, enums, guards — consumed by backend and frontend
- **API Playground:** Vue 3 + Tailwind CSS — interactive API documentation/testing tool
- **Runtime:** Node.js >=20, pnpm >=9

## Common Commands

```bash
# Install dependencies
pnpm install

# Development (all packages in parallel)
pnpm dev

# Development (individual packages)
pnpm dev:backend          # tsx watch src/index.ts
pnpm dev:frontend         # vite dev server

# Build (shared must build first — it's a dependency)
pnpm build:shared         # always run before full build
pnpm build                # build all packages

# Lint & Format
pnpm lint:fix             # eslint --fix
pnpm format               # prettier

# Type checking
pnpm typecheck            # runs tsc --noEmit across all packages

# Tests
pnpm test                 # vitest run across all packages
# Single package tests:
cd packages/backend && pnpm test          # vitest run
cd packages/backend && pnpm test:watch    # vitest (watch mode)
cd packages/frontend && pnpm test:unit    # vitest
cd packages/frontend && pnpm test:e2e     # playwright

# Database (from packages/backend or root with --filter)
pnpm --filter backend db:generate   # generate migrations
pnpm --filter backend db:migrate    # run migrations
pnpm --filter backend db:studio     # interactive DB browser
pnpm --filter backend db:seed       # seed data
```

## Architecture

### Monorepo Structure

```
packages/
├── backend/          — uWebSockets.js API server
├── frontend/         — Vue 3 SPA
├── shared/           — shared types, schemas, enums
└── api-playground/   — API documentation UI
```

The `shared` package must be built before `backend` or `frontend` can compile, since both depend on `shared` via `workspace:*`.

### Backend Architecture

**Path aliases** (configured in tsconfig.json `paths` and package.json `imports`):
- `#app/*` — `src/app/*` (controllers, routes, models, services, middleware, validation)
- `#config/*` — `src/config/*`
- `#vendor/*` — `src/vendor/*` (core framework: server, router, request handlers, types)
- `#database/*` — `src/database/*` (MySQL and Redis connections)
- `#drizzle/*` — `src/drizzle/*` (schema definitions, migrations)
- `#logger` — `src/vendor/utils/logger`

**Request flow:** Routes → Middleware chain → Validator (ArkType) → Controller handler → Response

**Route definitions** (`src/app/routes/http-routes.ts`, `ws-routes.ts`):
- Routes are plain arrays of group objects with `prefix`, `middlewares`, `rateLimit`, and nested `group` arrays
- Each route specifies `url`, `method`, `handler`, optional `validator` (key into schemas), and `typeResponse`
- Route groups support nesting for cascading middleware/prefix composition

**Controllers** (`src/app/controllers/http/`, `src/app/controllers/ws/`):
- Plain objects (not classes) with async handler methods
- HTTP handlers receive `HttpContext` with `{ requestId, logger, httpData, validator, responseData, session, auth }`
- WS handlers receive `WsContext` with `{ requestId, wsData, validator, responseData, logger }`
- Handlers return typed response objects; the framework serializes and sends them

**Middleware** (`src/app/middlewares/kernel.ts`):
- Registered as string keys mapping to functions in the kernel
- Core middlewares: `session_web`, `session_api`, `auth_guard`
- Applied per-route or per-group; groups cascade middleware to children

**Validation** (`src/app/validate/schemas/schemas.ts`):
- ArkType `type()` validators keyed by name (e.g., `'register'`, `'createChat'`)
- Referenced by string key in route definitions via the `validator` field

**Models** (`src/app/models/`):
- Data access objects (User, Message, Notes, Calendar, Task, Project, etc.)
- Interact with the database layer directly

**Database:**
- Drizzle ORM with MySQL dialect
- Schema definitions in `src/drizzle/schema/`
- Migrations in `src/drizzle/migrations/`
- Config in `drizzle.config.js` (reads from env vars: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DB_NAME`)

### Frontend Architecture

- Vue 3 Composition API with `<script setup>` throughout
- Pinia stores in `src/stores/`
- Vue Router with auth guards (checks `useUserStore().hasUser()`)
- Routes use `meta.tab` to render different panels within the main Chat view (projects, tasks, calendar, notes)
- Service Worker for PWA support (`src/service-worker.ts`)

### Shared Package

Exports via subpath entries (`shared/brands`, `/schemas`, `/enums`, `/events`, `/utils`, `/guards`). Uses ArkType for branded types and ts-pattern for type-safe matching.

## Environment Variables

Backend reads from `packages/backend/.env`:
- `APP_NAME`, `APP_KEY`, `APP_ENV`, `APP_URL`, `DOMAIN`, `HOST`, `PORT`
- `API_PATH_PREFIX` — URL prefix for all API routes (default: `api`)
- `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DB_NAME`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_PREFIX`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- `SERVE_STATIC` — serve frontend build from backend (boolean: `true`/`1`/`yes`/`on`)
- `DOC_PAGE` — enable API playground page (boolean)

## Code Style & Linting Rules

- **Strict TypeScript** everywhere: `noImplicitAny`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `strictBooleanExpressions` (no truthy coercion of strings/numbers/nullable objects)
- **ESLint** with `typescript-eslint` strict + stylistic: explicit return types required, no `any`, consistent type imports (`import type { ... }`), switch exhaustiveness checks
- **Formatting:** Prettier (2-space indent, single quotes)
- Unused vars must be prefixed with `_`

## Docker

Multi-stage Dockerfile: builds all packages, then runs migrations and starts the backend (`pnpm db:migrate && pnpm start`). Exposes port 3000.
