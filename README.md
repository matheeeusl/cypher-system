# Cypher System

A bilingual (English / Brazilian Portuguese) rules reference and character builder for the
[Cypher System](https://cypher-system.com/) tabletop RPG.

| Site                                   | What it is                                                      | Source                                                   |
| -------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| [csrd.app](https://csrd.app)           | Rules reference: chapters plus every Type, Descriptor, Focus, … | [`apps/docs`](apps/docs/README.md)                       |
| [play.csrd.app](https://play.csrd.app) | Character builder, character sheet and play mode                | [`apps/app`](apps/app/README.md)                         |
| [api.csrd.app](https://api.csrd.app)   | Public, stateless GraphQL API over the rules data and engine    | [`services/graphql-api`](services/graphql-api/README.md) |

## Repository layout

This is a pnpm workspace. Internal packages are scoped `@cypher/*`.

```
apps/
  docs/              @cypher/docs         Astro + Starlight rules reference
  app/               @cypher/app          Next.js character app (auth, Postgres)
services/
  graphql-api/       @cypher/graphql-api  Fastify + GraphQL Yoga rules API
packages/
  content/           @cypher/content      Rules data as YAML, validated with Zod
  cypher-engine/     @cypher/engine       Pure TypeScript rules engine
  ui/                @cypher/ui           Shared React components + design tokens
```

Each one has its own README:

- [`apps/docs`](apps/docs/README.md): the reference site
- [`apps/app`](apps/app/README.md): the character app
- [`services/graphql-api`](services/graphql-api/README.md): the GraphQL API
- [`packages/content`](packages/content/README.md): rules data
- [`packages/cypher-engine`](packages/cypher-engine/README.md): rules engine
- [`packages/ui`](packages/ui/README.md): components and the "Salvage Console" design system

### How the pieces fit

```
                 @cypher/content (YAML + Zod)
                    │            │
                    ▼            │
             @cypher/engine      │
                    │            │
          ┌─────────┴──────┐     │
          ▼                ▼     ▼
  services/graphql-api    apps/docs ◄── @cypher/ui
          │                              │
          ▼                              │
       apps/app ◄────────────────────────┘
       (Postgres: users + characters)
```

- **`@cypher/content`** is the single source of rules data. Nothing else hardcodes rules text.
- **`@cypher/engine`** turns a player's choices into a derived character (Pools, Edge, Effort,
  skills, abilities, tier) and reports rule violations as coded errors. It has no I/O and no
  framework imports.
- **`apps/docs`** reads content directly at build time and generates one page per entity.
- **`services/graphql-api`** exposes content and engine validation over GraphQL. It stores
  nothing.
- **`apps/app`** owns user data (accounts and characters). It saves a character's _choices_, not
  its derived stats, and re-derives them through the API, so a rules fix reaches existing
  characters on its own.
- **`@cypher/ui`** holds the shared components and design tokens used by both front ends.

## Getting started

Requirements: Node.js 22+ and pnpm 8+.

```sh
pnpm install   # once, at the repo root; don't install inside individual packages
pnpm build     # builds every package; the apps import the packages' compiled dist/
```

Then run what you need:

```sh
pnpm dev:docs    # reference site       → http://localhost:4321
pnpm dev:api     # GraphQL API          → http://localhost:4000/graphql
pnpm dev:app     # character app        → http://localhost:3000 (needs the API running and env vars, see apps/app)
pnpm storybook   # @cypher/ui Storybook → http://localhost:6006
```

The docs site and Storybook run with no configuration. The character app needs a Postgres
database and auth credentials; see [`apps/app`](apps/app/README.md#environment).

## Scripts

Run from the repo root:

| Command             | What it does                                 |
| ------------------- | -------------------------------------------- |
| `pnpm build`        | Build every package                          |
| `pnpm lint`         | ESLint across the workspace                  |
| `pnpm typecheck`    | `tsc` / `astro check` across the workspace   |
| `pnpm test`         | Vitest suites (content, engine, graphql-api) |
| `pnpm format`       | Format with Prettier                         |
| `pnpm format:check` | Check formatting without writing             |

To run a script in one package: `pnpm --filter @cypher/<name> <script>`.

> **Rebuilding dependencies.** `--filter` runs only in the named package; it doesn't rebuild the
> packages it depends on. After changing `@cypher/content` or `@cypher/engine`, verify a
> downstream package with the `...` suffix so its dependencies are rebuilt first:
>
> ```sh
> pnpm --filter "@cypher/graphql-api..." build
> ```

The character app's end-to-end tests (Playwright) run separately; see
[`apps/app`](apps/app/README.md#testing).

## Conventions

- **TypeScript** 5.9 in strict mode, plus `exactOptionalPropertyTypes` and
  `noUncheckedIndexedAccess` ([`tsconfig.base.json`](tsconfig.base.json)).
- **Styling**: Tailwind CSS v4, configured in CSS (no `tailwind.config.js`). Both apps import
  `@cypher/ui/styles/globals.css` for the tokens and utilities.
- **Bilingual content**: every player-facing string exists in `en` and `pt-BR`. Portuguese game
  terms follow a fixed glossary
  ([`.claude/skills/cypher-pt-br-translation/references/glossary.md`](.claude/skills/cypher-pt-br-translation/references/glossary.md)).
- **CI** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs lint, typecheck, format
  check and tests on every pull request and push to `main`.

Each package also has a `CLAUDE.md` with detailed design notes and known gaps.

## Deployment

All three sites are separate Vercel projects:

| Domain          | Vercel root            |
| --------------- | ---------------------- |
| `csrd.app`      | `apps/docs`            |
| `play.csrd.app` | `apps/app`             |
| `api.csrd.app`  | `services/graphql-api` |

The GraphQL API can also run as a container; see
[`services/graphql-api`](services/graphql-api/README.md#docker).
