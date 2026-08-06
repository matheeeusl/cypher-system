# Cypher System monorepo

A Cypher System TTRPG reference site + character sheet app, built as a fullstack/frontend learning project.

## Architecture

Two apps, three shared packages, all consuming a single design-token source.

```
apps/docs           Astro 7 + Starlight — rules reference site
apps/app             Next.js 16 (App Router) — character sheet app
packages/ui                 shared React components, design tokens, Storybook
packages/cypher-engine       plain TS rules engine (pools, effort, ability costs) — @cypher/engine
packages/content             YAML/JSON rules data — @cypher/content
```

Both apps depend on `@cypher/ui` for components and styles; `@cypher/engine` and `@cypher/content` are consumed as needed for rules logic and data. Internal packages are scoped `@cypher/*`.

## Package manager

pnpm workspaces (pnpm >= 8, Node >= 22). Workspace globs: `apps/*`, `packages/*` (see `pnpm-workspace.yaml`).

Install once at the root — do not run `npm install` or `yarn` inside individual packages.

## Commands

Run from the repo root unless noted:

- `pnpm build` — build all packages (`pnpm -r build`)
- `pnpm lint` — lint all packages (`pnpm -r lint`)
- `pnpm typecheck` — typecheck all packages (`pnpm -r typecheck`)
- `pnpm format` — format with Prettier (writes)
- `pnpm format:check` — check formatting without writing
- `pnpm dev:docs` — run the docs site dev server
- `pnpm dev:app` — run the character app dev server
- `pnpm storybook` — run Storybook for `@cypher/ui`

To scope a command to one package: `pnpm --filter @cypher/<name> <script>` (e.g. `pnpm --filter @cypher/app typecheck`).

Tests: Vitest (unit) and Playwright (e2e) are listed as devDependencies but not yet wired up in any package — there are no test scripts to run yet.

CI (`.github/workflows/ci.yml`) runs lint → typecheck → format check on PRs.

## Verifying a change to @cypher/content or @cypher/engine

`pnpm --filter <pkg> <script>` only runs the script in that one package — it does **not** rebuild that package's workspace dependencies first. After editing `@cypher/content` or `@cypher/engine`, a bare `pnpm --filter @cypher/graphql-api typecheck` (or `apps/docs`, or `apps/app` once it exists) can pass against a *stale* `dist/` of the upstream package, silently masking a real type error instead of catching it.

Use the `...` suffix instead — `pnpm --filter "@cypher/graphql-api..." build` (quote it; an unquoted `...` can glob-expand in some shells) — which pulls in that package's workspace dependencies too and runs them in topological order, so `@cypher/content`/`@cypher/engine` are rebuilt before the downstream package is type-checked or tested against them. Do this for any downstream-package verification after a content/engine change, not just a plain `--filter <pkg>`.

## Design system: "Salvage Console"

Dark-first, teal/graphite, utilitarian.

- Tokens: `packages/ui/src/styles/tokens.css` — raw CSS custom properties, dark as `:root` default, light via `[data-theme="light"]` override on `<html>`.
- Tailwind wiring: `packages/ui/src/styles/globals.css` — `@import "tailwindcss"` plus a Tailwind v4 `@theme` block that maps the CSS variables to utility classes (`bg-bg`, `text-text`, `border-border`, etc.). Tailwind v4 config lives in this CSS file, not a `tailwind.config.js`.
- Apps consume both in one import: `@cypher/ui/styles/globals.css`.
- Theme switching is just toggling `[data-theme="light"]` on `<html>` — CSS variables cascade automatically, no class changes needed on elements.

Fonts: Space Grotesk (headers/display), Inter (body), IBM Plex Mono (stat blocks, buttons/UI chrome).

| Token | Dark | Light |
|---|---|---|
| bg | `#14181C` | `#F2F4F4` |
| panel | `#232B31` | `#F7F8F8` |
| text | `#D8E3E7` | `#1A2226` |
| text-muted | `#7C8A90` | `#5B6A70` |
| accent | `#4FB8B0` | `#0F6E56` |
| accent-soft | `rgba(79,184,176,0.12)` | `#DCEEEA` |
| warning | `#C97B4A` | `#A85A2E` |
| border | `#2B333A` | `#D7DBDC` |

## TypeScript

TS 5.9, strict mode plus `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` (see `tsconfig.base.json`).

## Collaboration notes

This is a learning project — walk through changes step by step with explanations rather than generating large chunks of code silently.
