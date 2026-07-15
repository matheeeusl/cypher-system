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

## What's here now

The app is still the Next.js starter scaffold (`app/page.tsx`, default fonts wiring) — no character sheet features exist yet. Don't assume routes, data models, or Supabase tables beyond what's actually in the tree.
