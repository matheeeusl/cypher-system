# @cypher/docs

The Cypher System rules reference at [csrd.app](https://csrd.app), in English (`/en/…`) and
Brazilian Portuguese (`/pt-br/…`). A static site: rules chapters plus a page for every Type,
Descriptor, Focus, Flavor, Ability, Skill, Cypher and Artifact.

Part of the [Cypher System monorepo](../../README.md).

## Stack

- [Astro 7](https://astro.build) + [Starlight](https://starlight.astro.build), output as static
  HTML
- [`@cypher/content`](../../packages/content/README.md) for all rules data, read at build time
- [`@cypher/ui`](../../packages/ui/README.md) for design tokens and Tailwind CSS v4
- Pagefind search (built into Starlight)

## Kinds of pages

| Kind           | Where it lives                               | How to add one                                         |
| -------------- | -------------------------------------------- | ------------------------------------------------------ |
| Rules chapters | `src/content/docs/<locale>/rules/*.md(x)`    | Add the file in both locales; the sidebar picks it up  |
| Entity pages   | `src/pages/[locale]/<category>/[slug].astro` | Nothing: add the YAML to `@cypher/content` and rebuild |
| Equipment      | `src/pages/[locale]/equipment/index.astro`   | One fixed page of reference tables                     |
| Homepage       | `src/pages/[locale]/index.astro`             | Standalone page outside the Starlight shell            |

Entity pages are generated with `getStaticPaths()` over every locale and every entry from
`@cypher/content`, so the site never lists something the data doesn't have. Rules chapters can
link to entities inline with `src/components/EntityLink.astro`, which fails the build on an
unknown id instead of shipping a dead link.

### Where things are

```
src/content/docs/   rules chapters and glossary, one folder per locale
src/pages/          generated entity pages, homepage, 404, sidebar lists
src/components/     header, sidebar, breadcrumbs, entity links and Starlight overrides
src/lib/            shared helpers (locale mapping, page context, formatting)
src/styles/         globals.css: imports @cypher/ui's tokens and maps Starlight's variables onto them
astro.config.mjs    locales, sidebar groups, component overrides
```

## Translations

Both locales are prefixed in the URL (there is no root locale). Content fields from
`@cypher/content` are `{ en, 'pt-BR' }`; use `pick()` from `src/lib/locale.ts` to read the right
one.

Portuguese game terms (Margem for Edge, Reserva for Pool, …) come from one glossary:
[`.claude/skills/cypher-pt-br-translation/references/glossary.md`](../../.claude/skills/cypher-pt-br-translation/references/glossary.md).
Check it before writing any pt-BR copy.

## Running locally

From the repo root:

```sh
pnpm install
pnpm build        # the site imports the packages' compiled output
pnpm dev:docs     # http://localhost:4321/en/
```

No environment variables are needed.

## Scripts

| Script      | What it does                 |
| ----------- | ---------------------------- |
| `dev`       | Astro dev server             |
| `build`     | Static build to `dist/`      |
| `preview`   | Serve the built site locally |
| `typecheck` | `astro check`                |
| `lint`      | ESLint over `src/`           |

## Deployment

Vercel project with root `apps/docs`, build command
`cd ../.. && pnpm --filter "@cypher/docs..." build` (rebuilds the workspace packages first) and
output directory `dist`. Cache headers are in [`vercel.json`](vercel.json).

See [`CLAUDE.md`](CLAUDE.md) for the detailed notes on Starlight overrides, the sidebar, page
layout and typography.
