## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## i18n

Two locales, both explicitly prefixed — no `root` locale: `en` and `pt-br` (lowercase in the URL and in `locales`' config key, because Starlight matches a page's locale against the URL's first path segment as an exact, case-sensitive string against that key). BCP-47 casing (`pt-BR`) is set separately via each locale's `lang` field, so `<html lang>` and Starlight's own UI translations still use it. `@cypher/content`'s `LocalizedString` fields are keyed `{ en, 'pt-BR' }` — the `pick()` helper in `src/lib/locale.ts` bridges the URL-locale casing to that field casing; reuse it (and `URL_LOCALES`/`UrlLocale`) in any new entity page rather than re-deriving the mapping.

## Three kinds of pages

**Narrative chapters** (Getting Started, Core Mechanics, Combat, Recovery, Advancement, …) are real Starlight content-collection pages under `src/content/docs/<locale>/<section>/`, one file per locale. The `docs` collection (defined in `src/content.config.ts`) uses Starlight's own `docsLoader()` and `docsSchema()` — don't hand-roll a schema here; frontmatter fields (`title`, `description`, etc.) follow whatever Starlight's schema expects. The `Rules` sidebar group uses `autogenerate` (`items: [{ autogenerate: { directory: 'rules' } }]` — note the nested `items` array; a bare `{ label, autogenerate }` was removed in Starlight v0.39), so adding a narrative page only requires the `.md`/`.mdx` file — no sidebar edit needed.

**Entity reference pages** (Types, and eventually Descriptors/Foci/Abilities/Skills/Equipment/Cyphers/Artifacts/Oddities) are generated from `@cypher/content`'s loader, not hand-written files. They live under `src/pages/<locale>/<category>/[slug].astro` using Starlight's `<StarlightPage>` component (for full chrome outside the content collection) with `getStaticPaths()` iterating `URL_LOCALES × getAllX()`. Because `getStaticPaths()` runs in an isolated scope and can only see values reachable via `import` (not sibling consts/functions declared elsewhere in the same frontmatter block), shared helpers for these pages belong in `src/lib/`, not inline. Adding a Type requires no code change — new pages generate automatically at build/dev time from `packages/content`'s YAML.

**Equipment is not one of these.** The rulebook has no named-item catalog — no `EquipmentItem` entity exists in `@cypher/content` (see that package's CLAUDE.md). When `/equipment/` eventually gets built, it's a small static reference page (weapon categories, armor categories, price tiers, sourced from `@cypher/content`'s `reference-tables/`), not a generated-per-item `[slug].astro` like the entity categories above.

**Equipment is not one of these.** The rulebook has no named-item catalog — no `EquipmentItem` entity exists in `@cypher/content` (see that package's CLAUDE.md). When `/equipment/` eventually gets built, it's a small static reference page (weapon categories, armor categories, price tiers, sourced from `@cypher/content`'s `reference-tables/`), not a generated-per-item `[slug].astro` like the entity categories above.

These pages can't join the `autogenerate` sidebar group, so each category needs a manual sidebar group in `astro.config.mjs`, built by calling e.g. `getAllTypes()` at config-load time (this runs as real Node code). Manual sidebar `link` values must be locale-neutral (`/types/warrior/`, no locale prefix) — Starlight's sidebar renderer injects the _current page's_ locale onto `link` unconditionally, so a link that already included one would double up (`/en/en/types/warrior/`). Per-locale label text goes in each item's `translations` map instead.

**Standalone pages** (currently just the homepage, `src/pages/[locale]/index.astro`) sit entirely outside the Starlight docs shell — no `<StarlightPage>`, no sidebar, no Starlight header. Used when a page's source design has no sidebar/TOC chrome of its own (a landing page, not a docs page). Because these bypass Starlight's render pipeline, `customCss` (Starlight-integration-only) doesn't reach them — import `../../styles/globals.css` directly in frontmatter instead. Theme and language switching can't use Starlight's `ThemeProvider`/`LanguageSelect` either; reimplement against the same contract so a preference set on one kind of page carries into the other: locale switching is a real link to `/en/` or `/pt-br/` (never a client-side-only toggle — these are routed locales, not app state), and theme switching reads/writes `localStorage['starlight-theme']` and `document.documentElement.dataset.theme`, mirroring Starlight's own inline `ThemeProvider` script exactly (same key, same values) so the two chromes never fight over the current theme.

## Styling

Don't add a local Tailwind theme or token file here. `src/styles/globals.css` imports `@cypher/ui/styles/globals.css` for tokens/Tailwind, then adds a small block mapping Starlight's own CSS variables (`--sl-color-accent`, `--sl-color-bg`, etc.) onto the shared tokens. If a new Starlight UI element needs theming, extend that mapping block rather than overriding Starlight's classes directly.
