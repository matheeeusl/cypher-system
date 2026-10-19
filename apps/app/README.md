# @cypher/app

The character app at [play.csrd.app](https://play.csrd.app): build a Cypher System character
step by step, keep a printable character sheet, and track it in play (Pools, damage track, XP,
advancement, inventory, notes). Fully bilingual (`/en/…` and `/pt-br/…`).

Part of the [Cypher System monorepo](../../README.md).

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions)
- [Better Auth](https://www.better-auth.com): email + password (with email verification) and
  Google sign-in
- Postgres on [Neon](https://neon.tech), queried with `pg` (no ORM)
- [Resend](https://resend.com) for verification and password-reset emails
- [`@cypher/ui`](../../packages/ui/README.md) for components and design tokens
- [`services/graphql-api`](../../services/graphql-api/README.md) for rules data and validation

## How it works

The app owns user data; the rules live elsewhere.

- A character is stored as the player's **choices** (Type, Descriptor, Focus, picks, advancement
  purchases), never as derived stats. Every view re-derives the sheet through graphql-api's
  `validateCharacterChoices`, so a rules fix applies to saved characters on its own. Each
  character also records the content versions it was built with, which drives the "Rules
  Update" badge.
- Every write is a Server Action that re-validates its input and asks graphql-api before
  storing anything.
- There's no row-level security in the database. Every query in `lib/characters.ts` and
  `lib/play.ts` is scoped by the user id from the server-side session, and that is the only
  authorization boundary.

### Routes

| Route                            | Page                                                |
| -------------------------------- | --------------------------------------------------- |
| `/`                              | Character wizard (redirects to sign-in when needed) |
| `/{locale}`                      | Your characters                                     |
| `/{locale}/auth`                 | Sign in / sign up                                   |
| `/{locale}/reset-password`       | Password reset                                      |
| `/{locale}/characters/{id}`      | Read-only, printable character sheet                |
| `/{locale}/characters/{id}/edit` | Wizard, opened on its Review step                   |
| `/{locale}/characters/{id}/play` | Play mode                                           |

### Where things are

```
app/                 routes, layouts, Server Actions
components/wizard/   the character wizard (one file per step, pure logic in derive.ts)
components/play/     play mode (PlayScreen.tsx queues server calls in order)
lib/                 auth, sessions, database access, GraphQL client, i18n copy
db/migrations/       numbered SQL migrations
scripts/             db-migrate.mjs
e2e/                 Playwright tests
```

## Environment

Copy [`.env.example`](.env.example) to `.env.local` and fill it in:

| Variable                        | Purpose                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_GRAPHQL_API_URL`   | GraphQL endpoint (default `http://localhost:4000/graphql`); baked in at build time |
| `NEXT_PUBLIC_DOCS_URL`          | Base URL for "View in the reference" links (default `https://csrd.app`)            |
| `BETTER_AUTH_SECRET`            | Random secret, e.g. `openssl rand -base64 32`                                      |
| `BETTER_AUTH_URL`               | The app's own URL (`http://localhost:3000` locally)                                |
| `GOOGLE_CLIENT_ID` / `_SECRET`  | Google OAuth client; redirect URI `…/api/auth/callback/google`                     |
| `DATABASE_URL`                  | Postgres connection string (Neon's pooled one)                                     |
| `RESEND_API_KEY` / `EMAIL_FROM` | Email sending; `EMAIL_FROM` must use a domain verified in Resend                   |

## Running locally

From the repo root:

```sh
pnpm install
pnpm build                                  # the app imports @cypher/ui's compiled output

# One-time database setup
pnpm --filter @cypher/app db:migrate        # app tables (tracked in schema_migrations)
cd apps/app && npx auth@latest migrate --config lib/auth.ts   # Better Auth tables

# Every time, in two terminals
pnpm dev:api                                # graphql-api on :4000; the app doesn't start it for you
pnpm dev:app                                # http://localhost:3000
```

`db:migrate` applies whatever database `.env.local` points at, so don't keep a production URL
there. In production the app connects with a role that can only read and write rows, and
migrations run separately with the owner role.

New migrations go in `db/migrations/` as the next number (`005_….sql`, …).

## Testing

End-to-end tests use Playwright:

```sh
npx playwright install chromium            # once per machine, from apps/app
pnpm dev:api                               # must already be running
pnpm --filter @cypher/app test:e2e
```

The config starts `next dev` itself (or reuses one already running) and reads `.env.local`. A
global setup creates a throwaway verified user and its teardown deletes it, so the tests need a
real `DATABASE_URL`. The specs cover the wizard in both languages and play mode.

## Scripts

| Script       | What it does                 |
| ------------ | ---------------------------- |
| `dev`        | Next.js dev server           |
| `build`      | Production build             |
| `start`      | Serve the production build   |
| `lint`       | ESLint                       |
| `typecheck`  | `tsc --noEmit`               |
| `test:e2e`   | Playwright suite             |
| `db:migrate` | Apply pending SQL migrations |

See [`CLAUDE.md`](CLAUDE.md) for the detailed design notes (play mode, advancement, flavors,
i18n, SEO).
