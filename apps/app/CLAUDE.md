# @cypher/app — character sheet app

Next.js 16, App Router. Depends on `@cypher/ui` for components/tokens and (as they're built out) `@cypher/engine` for rules logic and `@cypher/content` for rules data.

## App Router conventions

- Routes live under `app/`. Default to Server Components; only add `'use client'` to a file when it needs state, effects, or browser APIs — keep client components as small/leaf as possible.
- Data mutations belong in Server Actions or Route Handlers, not client-side fetch calls to your own backend.
- `app/layout.tsx` loads the three design fonts via `next/font/google` (Space Grotesk, Inter, IBM Plex Mono) as CSS variables (`--font-display`, `--font-sans`, `--font-mono`). These feed the `--font-*` mappings in `@cypher/ui`'s `@theme` block — don't re-import fonts elsewhere or hardcode font-family values.
- `app/globals.css` should stay a thin entry point that pulls in `@cypher/ui/styles/globals.css`; put any app-only CSS in its own file rather than growing this one.

## Supabase (planned)

Supabase (auth + Postgres + RLS) isn't wired up yet. When it lands:

- Use the `@supabase/ssr` package with separate client helpers for Server Components/Actions vs. the browser — never share one client across both.
- Treat Row Level Security as the actual authorization boundary; don't reimplement ownership checks in application code that RLS should already enforce.
- Keep Supabase client construction in one place (e.g. `lib/supabase/`) rather than instantiating clients inline in routes/components.

## GraphQL

- `lib/graphql/client.ts` — a thin `fetch` wrapper (`gqlRequest`), not `graphql-request`. Reads the endpoint from `NEXT_PUBLIC_GRAPHQL_API_URL` (see `.env.example`), defaulting to `http://localhost:4000/graphql`.
- `lib/graphql/queries.ts` — hand-written query strings + matching TS types, one section per entity (Type/Descriptor/Focus/Skill/Ability/validateCharacterChoices). No codegen yet; keep these in sync by hand.
- `services/graphql-api` doesn't have a watch-mode dev workflow by default outside this app's needs — run it with `pnpm dev:api` from the repo root (added alongside this wizard; wraps `tsx watch`). It must be running separately from `pnpm dev:app` for the wizard to work — nothing here auto-starts it.
- `ChoiceAbility.options` in `schema.graphql` is `[[ID!]!]!` (a list of option-bundles, each a list of ability ids), not a flat `[ID!]!` — a few Foci offer a "choose either X, or both Y and Z" bundled-pair option. See `packages/content/src/schemas/focus.ts`'s comment on `tier_abilities` for the source shape.
- **Known gap, not fixed:** when a tier-1 Focus choice entry has `count > 1` (Channels Divine Blessings is the one real case — pick-2-of-13), this wizard sends all chosen ability ids to `validateCharacterChoices` correctly, but the server's `mapFocusChoiceSelections` (services/graphql-api) collapses multiple `{tier, abilityId}` pairs sharing a tier down to the last one, and `@cypher/engine`'s `resolveFocusAbilities` can only hold one selection per tier anyway. Fixing it means changing that `Record<string, string>` to `Record<string, string[]>` end to end — out of scope for this pass.

## Wizard (character builder)

- `components/wizard/Wizard.tsx` is the whole thing — one client component owning all `WizardChoices` state, per-step data fetching (fetch-on-first-visit into `components/wizard/state.ts`-shaped caches), and the debounced `validateCharacterChoices` call that drives the live pool/edge/effort preview.
- One file per step kind under `components/wizard/` (`TypeStep.tsx`, `DescriptorStep.tsx`, etc.) plus `derive.ts` for the pure logic (step validity, error messages, building the mutation input) — keep new step logic there, not inlined in `Wizard.tsx`.
- No save button yet: the Review step's primary action is a visibly disabled "Save Character (coming soon)" button, not a `Button` from `@cypher/ui` (that component has no `disabled` prop) — a plain styled `<button disabled>` instead.

## Testing

- `pnpm --filter @cypher/app test:e2e` (or `pnpm -F @cypher/app test:e2e`) runs the Playwright suite in `e2e/`. `playwright.config.ts`'s `webServer` starts `next dev` for you (reusing one already running locally) — but **graphql-api must already be running separately** (`pnpm dev:api`), same as for manual testing.
- First run on a fresh machine needs browsers installed once: `npx playwright install chromium` from `apps/app/`.
