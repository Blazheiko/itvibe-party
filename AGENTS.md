# Repository Guidelines

## Project Structure & Module Organization
This repository is a `pnpm` monorepo with four workspace packages:
- `packages/backend`: Node.js + TypeScript API server (`src/`, `public/`, `scripts/`, Drizzle migrations in `src/drizzle/`).
- `packages/frontend`: Vue 3 + Vite app (`src/`, static assets in `public/`, E2E tests in `e2e/`).
- `packages/api-playground`: Separate Vue + Vite client for API exploration (`src/`, `docs/`, `public/`).
- `packages/shared`: Shared TypeScript types/schemas/utilities consumed by other packages.

Build artifacts are generated into `dist/` and should not be edited directly.

## Build, Test, and Development Commands
Run from repository root unless noted:
- `pnpm dev`: Start all workspace dev processes in parallel.
- `pnpm dev:backend` / `pnpm dev:frontend`: Start one app only.
- `pnpm build`: Build all packages.
- `pnpm lint`: Run root ESLint rules.
- `pnpm typecheck`: Run TypeScript checks across packages.
- `pnpm test`: Run package test scripts.

Package-specific examples:
- `pnpm --filter frontend test:unit` (Vitest)
- `pnpm --filter frontend test:e2e` (Playwright)
- `pnpm --filter backend test` (Vitest run)

## Coding Style & Naming Conventions
- Language: TypeScript-first; Vue SFCs in frontend packages.
- Formatting: Prettier (`pnpm format`, `pnpm format:check`).
- Linting: ESLint flat configs at root and per frontend package.
- Prefer explicit types and `import type` where applicable (enforced by lint rules).
- Naming patterns: Vue components in PascalCase (e.g., `ChatArea.vue`), utilities/composables in camelCase (`useWebRTC.ts`, `formatMessageDate.ts`).

## Testing Guidelines
- Frameworks: Vitest (unit/integration), Playwright (frontend E2E).
- Place frontend E2E specs under `packages/frontend/e2e/*.spec.ts`.
- For new unit tests, prefer `*.spec.ts` near feature code or in `__tests__/`.
- Run relevant package tests before opening a PR; no global coverage threshold is currently enforced.

## Commit & Pull Request Guidelines
Recent history follows concise, conventional-style subjects, e.g.:
- `refactor: ...`
- `setup monorepo: ...`
- `update ...`

Use `<type>: <short imperative summary>` when possible (`feat`, `fix`, `refactor`, `chore`, `docs`, `test`).

PRs should include:
- Clear scope and rationale.
- Linked issue/task when available.
- Test evidence (commands run and result).
- UI screenshots/video for frontend-visible changes.

## Security & Configuration Tips
- Use Node `>=20` and `pnpm >=9` as defined in workspace config.
- Keep secrets in environment files; never commit credentials.
- For backend DB changes, include migration generation/migration steps in the PR notes.
