# @cypher/app — character sheet app

Next.js 16, App Router. Depends on `@cypher/ui` for components/tokens and (as they're built out) `@cypher/engine` for rules logic and `@cypher/content` for rules data.

## App Router conventions

- Routes live under `app/`. Default to Server Components; only add `'use client'` to a file when it needs state, effects, or browser APIs — keep client components as small/leaf as possible.
- Data mutations belong in Server Actions or Route Handlers, not client-side fetch calls to your own backend.
- `app/layout.tsx` loads the three design fonts via `next/font/google` (Space Grotesk, Inter, IBM Plex Mono) as CSS variables (`--font-display`, `--font-sans`, `--font-mono`). These feed the `--font-*` mappings in `@cypher/ui`'s `@theme` block — don't re-import fonts elsewhere or hardcode font-family values.
- `app/globals.css` should stay a thin entry point that pulls in `@cypher/ui/styles/globals.css`; put any app-only CSS in its own file rather than growing this one.

## Auth (Better Auth + Neon)

- `lib/auth.ts` is the single Better Auth instance: Postgres (Neon, `DATABASE_URL`, pooled string) via `pg`, email + password with **required email verification**, Google social login, `nextCookies()` plugin. Handler lives at `app/api/auth/[...all]/route.ts`; the browser client is `lib/auth-client.ts`.
- Emails (verification, password reset) go through Resend in `lib/email.ts`. The email language is read from the `callbackURL` inside the link Better Auth generates, so always pass `/${locale}/…` as `callbackURL`/`redirectTo` from the client. `EMAIL_FROM` must use a domain verified in Resend.
- Schema was created with `npx auth@latest migrate --config lib/auth.ts` (load `.env.local` first). Re-run it after adding plugins or user fields.
- Server-side session: `getSession()` in `lib/session.ts`. `/` (the wizard) redirects to `/{locale}/auth` when there is no session; `/{locale}/auth` redirects to `/` when there is one. Check the session on the server — don't rely on client state.
- There is no Row Level Security: ownership/authorization checks for user data must live in application code (and in the graphql-api once it stores per-user data).
- UI lives in `@cypher/ui` (`AuthForm`, `ResetPasswordForm`, `AuthCard`, `TextField`, …) and takes all text via `labels` props; copy for en/pt-br is in `lib/i18n/auth.ts`.

## Characters (saved to Neon)

- Table `character` (`db/migrations/001_character.sql`): `choices` (the wizard's `WizardChoices`, not the derived sheet — it's recomputed via graphql-api so rules fixes apply on their own), a denormalized `summary` for the list, and `content_versions` (contentVersion of the Type/Descriptor/Focus used) which drives the "Rules Update" badge. Apply migrations with `pnpm --filter @cypher/app db:migrate` (reads `.env.local`; tracked in `schema_migrations`). Add new migrations as `002_….sql`, etc.
- **Database credentials (do before publishing):** `scripts/db-migrate.mjs` only reads `DATABASE_URL` from the environment and is never served (it lives outside `app/` and `public/`), but it needs DDL rights. Today one Neon owner role is used for both migrating and running the app. For production use two roles: a migration role (used only by deploy/CI, never present on the app server) and a runtime role limited to SELECT/INSERT/UPDATE/DELETE on the tables, which goes in the app's `DATABASE_URL`. Also remember `db:migrate` targets whatever `.env.local` points at — don't keep the production URL there.
- All reads/writes go through `lib/characters.ts`, and **every query is scoped by `user_id` taken from the session** — that is the only authorization boundary (no RLS). Never pass a user id that came from the client.
- Writes are server actions in `app/[locale]/characters/actions.ts`. Their input is untrusted: `lib/characters-input.ts` re-parses the shape and `lib/prepare-character.ts` re-checks every wizard step and asks graphql-api's `validateCharacterChoices` before anything is stored. It needs graphql-api running.
- Plan limits (future free/paid tiers) belong in `lib/entitlements.ts` (`characterLimit`, currently unlimited) — `createCharacter` already enforces it.
- Architecture decision: the app owns user data (auth + characters); graphql-api stays a stateless, public rules service shared with `apps/docs`. If a second client (mobile/public API) or paid rules content ever needs the same user data, move auth + `lib/characters.ts` into the service.
- The list cards open `/{locale}/characters/{id}`, which is the wizard on its Review step until a read-only character sheet exists.

## GraphQL

- `lib/graphql/client.ts` — a thin `fetch` wrapper (`gqlRequest`), not `graphql-request`. Reads the endpoint from `NEXT_PUBLIC_GRAPHQL_API_URL` (see `.env.example`), defaulting to `http://localhost:4000/graphql`.
- `lib/graphql/queries.ts` — hand-written query strings + matching TS types, one section per entity (Type/Descriptor/Focus/Skill/Ability/validateCharacterChoices). No codegen yet; keep these in sync by hand.
- `services/graphql-api` doesn't have a watch-mode dev workflow by default outside this app's needs — run it with `pnpm dev:api` from the repo root (added alongside this wizard; wraps `tsx watch`). It must be running separately from `pnpm dev:app` for the wizard to work — nothing here auto-starts it.
- `ChoiceAbility.options` in `schema.graphql` is `[[ID!]!]!` (a list of option-bundles, each a list of ability ids), not a flat `[ID!]!` — a few Foci offer a "choose either X, or both Y and Z" bundled-pair option. See `packages/content/src/schemas/focus.ts`'s comment on `tier_abilities` for the source shape.
- **Known gap, not fixed:** when a tier-1 Focus choice entry has `count > 1` (Channels Divine Blessings is the one real case — pick-2-of-13), this wizard sends all chosen ability ids to `validateCharacterChoices` correctly, but the server's `mapFocusChoiceSelections` (services/graphql-api) collapses multiple `{tier, abilityId}` pairs sharing a tier down to the last one, and `@cypher/engine`'s `resolveFocusAbilities` can only hold one selection per tier anyway. Fixing it means changing that `Record<string, string>` to `Record<string, string[]>` end to end — out of scope for this pass.

## Wizard (character builder)

- `components/wizard/Wizard.tsx` is the whole thing — one client component owning all `WizardChoices` state, per-step data fetching (fetch-on-first-visit into `components/wizard/state.ts`-shaped caches), and the debounced `validateCharacterChoices` call that drives the live pool/edge/effort preview.
- One file per step kind under `components/wizard/` (`TypeStep.tsx`, `DescriptorStep.tsx`, etc.) plus `derive.ts` for the pure logic (step validity, error messages, building the mutation input) — keep new step logic there, not inlined in `Wizard.tsx`.
- The Review step's primary action saves the character through the `saveCharacter` server action (see Characters below) and returns to `/{locale}`. `Wizard` takes optional `characterId` + `initialChoices` to edit a saved character; it then opens on the Review step.

## Testing

- `pnpm --filter @cypher/app test:e2e` (or `pnpm -F @cypher/app test:e2e`) runs the Playwright suite in `e2e/`. `playwright.config.ts`'s `webServer` starts `next dev` for you (reusing one already running locally) — but **graphql-api must already be running separately** (`pnpm dev:api`), same as for manual testing.
- First run on a fresh machine needs browsers installed once: `npx playwright install chromium` from `apps/app/`.
- `e2e/global-setup.ts` creates a throwaway verified user (directly flips `emailVerified` in Postgres), signs in once, and saves the session to `e2e/.auth/` (gitignored); its teardown deletes the user, which cascades to their characters. `playwright.config.ts` loads `.env.local`, so `DATABASE_URL` must be set. The wizard test covers save → list → reopen → delete.
