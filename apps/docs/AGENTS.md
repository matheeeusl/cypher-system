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

**Equipment is not one of these.** The rulebook has no named-item catalog — no `EquipmentItem` entity exists in `@cypher/content` (see that package's CLAUDE.md). `/equipment/` is a single fixed page per locale (`src/pages/[locale]/equipment/index.astro`, `getStaticPaths()` over `URL_LOCALES` only) rendering the weapon/armor/price-tier/ammunition reference tables, and gets one plain `link` in the sidebar rather than a generated group. Its tables and the Focus Connections table in the Character Creation chapter share `src/components/ReferenceTable.astro`.

**MDX chapters** can use `src/components/EntityLink.astro` for inline `[Type: Warrior]`-style pills — it takes an entity `kind` + `id`, resolves the name from `@cypher/content`, and throws at build time on an unknown id, so a chapter can't ship a dead cross-link. Don't put `{/* … */}` comments in `.mdx` bodies: Prettier rewrites them into escaped text that breaks the build. Use YAML `#` comments in the frontmatter instead. Adjacent inline components need an explicit `{" "}` between them (MDX drops the bare space).

**`not-content` opts out *descendants*, not the element that carries it.** Starlight's markdown CSS (`.sl-markdown-content :not(a, span, …) + :not(…, :where(.not-content *))`) adds a 16px `margin-top` to any block-level element that follows a sibling, and styles links inside prose; the escape hatch is `:where(.not-content *)`, which only matches things *inside* a `.not-content` ancestor. So put `not-content` on the wrapper around sibling `<div>`s / a link, never on the `<div>`/`<a>` itself (Tailwind's `not-prose` is unrelated and does not do this).

These pages can't join the `autogenerate` sidebar group, so each category needs a manual sidebar group in `astro.config.mjs`, built by calling e.g. `getAllTypes()` at config-load time (this runs as real Node code). Manual sidebar `link` values must be locale-neutral (`/types/warrior/`, no locale prefix) — Starlight's sidebar renderer injects the _current page's_ locale onto `link` unconditionally, so a link that already included one would double up (`/en/en/types/warrior/`). Per-locale label text goes in each item's `translations` map instead.

**Standalone pages** (currently just the homepage, `src/pages/[locale]/index.astro`) sit entirely outside the Starlight docs shell — no `<StarlightPage>`, no sidebar, no Starlight-managed page frame. Used when a page's source design has no sidebar/TOC chrome of its own (a landing page, not a docs page). Because these bypass Starlight's render pipeline, `customCss` (Starlight-integration-only) doesn't reach them — import `../../styles/globals.css` directly in frontmatter instead.

**The header is shared across both page kinds, not duplicated.** `src/components/SiteHeader.astro` renders the actual bar (branding, EN/PT-BR toggle, theme toggle) and takes a `search` slot; it's used two ways — standalone pages import and render it directly with no `search` slot content, while Starlight-shell pages get it via `src/components/Header.astro`, wired as Starlight's `components.Header` override in `astro.config.mjs`, which fills the `search` slot with Starlight's real `<Search>` (imported from `@astrojs/starlight/components/Search.astro`, not the `virtual:starlight/components/Search` specifier Starlight's own internals use — that virtual specifier has no public type declarations for consumer code, so `astro check` can't resolve it; the real component file path is both typed and functionally identical). Search is the *only* deliberate difference between the two — everything else in the bar renders identically. Locale switching swaps the URL's first path segment (`/en/` ↔ `/pt-br/`) rather than jumping to the locale root, so it preserves the current page on both standalone and Starlight-shell pages alike (every route on this site is locale-prefixed with no exceptions, so this holds everywhere). Theme switching reads/writes `localStorage['starlight-theme']` and `document.documentElement.dataset.theme`, mirroring Starlight's own inline `ThemeProvider` script exactly (same key, same values) so the two chromes never fight over the current theme — Starlight-shell pages still run Starlight's own `<ThemeProvider/>` first (from its unmodified `<head>`), and `SiteHeader`'s script re-confirms the same value redundantly but harmlessly.

## Page frame: content box, breadcrumb, eyebrow

Starlight-shell pages render their content in a centered, fixed-width bordered box (the `main` rule in `src/styles/globals.css`, from 50rem up; full-bleed below). Two things around the title are **not** written per page — don't add them to a new entity page:

- **Breadcrumb** (`Home / Types / Warrior`) sits _above_ the box, outside `<main>`. Starlight only exposes one component that wraps `<main>`, so `src/components/TwoColumnContent.astro` (wired as `components.TwoColumnContent`) wraps Starlight's own and mounts `src/components/Breadcrumbs.astro` before it. The box and the trail share one width/centering rule in `globals.css` so their left edges line up.
- **Eyebrow** (`● FOCUS`) sits above the h1, via `src/components/PageTitle.astro` (`components.PageTitle`, also wrapping Starlight's default). Only sections with a `kind` in `src/lib/page-context.ts` get one; narrative chapters render the plain title.

Both are derived from the URL (`/<locale>/<section>/<slug>/`) through `getPageContext()` in `src/lib/page-context.ts`, which holds the section → label map. A new entity category needs an entry there (EN + pt-br crumb and kind) alongside its sidebar group. Page-specific extras (Cypher's category badge, Artifact's flavor quote, the tagline) stay in the page's own slot content, which renders right under the title: the first two content panels are merged into one header block whenever an eyebrow is present (`:has(.page-eyebrow)` rule in `globals.css`).

**Sidebar collapse** is a header button (`src/components/SidebarToggle.astro`) that flips `data-sidebar-collapsed` on `<html>`; the layout change is pure CSS in `globals.css` (zero `--sl-sidebar-width`, hide `.sidebar-pane`), desktop-only — below 50rem Starlight's own hamburger drawer is untouched. State persists in `localStorage['cypher-sidebar-collapsed']` and is applied before first paint by an inline script in the Starlight `head` config in `astro.config.mjs` (same mechanism as the theme), so keep the two storage-key strings in sync. `SiteHeader.astro` exposes a `leading` slot for the button; only `Header.astro` fills it, and only when the page has a sidebar, so the standalone homepage is unaffected.

**Sidebar look** follows the "Contents" column of the Narrative Chapter mock (Claude Design project "Cypher System design system", `Narrative Chapter Page.dc.html`): same canvas as the page with a hairline edge (`--sl-color-bg-sidebar` / `--sl-color-hairline-shade` remapped), 260px wide, group labels as mono caps, flat 13px entries, and the current page as a soft-teal row with a 2px accent edge. It is all plain rules in `globals.css` — Starlight's sidebar CSS lives in a cascade layer, so no specificity fights. The mock also lists the current page's sections under its entry; `src/components/Sidebar.astro` wraps Starlight's `Sidebar` for that (only `Sidebar`, not `SidebarSublist`, is overridable): it renders the route's `h2` headings into a `<template>` and an `is:inline` script moves them under `a[aria-current="page"]` before first paint. Those links aren't rendered by Starlight's sublist, so its component-scoped link CSS doesn't reach them — `.page-sections` restates `display`/`text-decoration`. Entity pages have no markdown headings, so they get the style but no section list. Sections don't highlight as you scroll (the mock doesn't either).

**Focus tier abilities show the full ability, not a pill.** The Focus page renders each ability (tier grants, choice options, Type Swap Option) through `src/components/AbilityEntry.astro`: name linked to its Ability page, a `cost · action type` meta line, then the description. It takes an _id_ and does the `getAbilityById` lookup itself, so an id that doesn't resolve falls back to the id as an unlinked name plus a "not transcribed" note instead of a dead link. Cost/action-type wording is shared with the Ability page through `src/lib/ability-format.ts` — add new ability-display labels there, not inline in a page. A tier's `not-content` wrapper (not the row) is what stops Starlight's sibling-margin rules from padding each row.

**Typography.** The three families (Space Grotesk / Inter / IBM Plex Mono) are only _named_ in `@cypher/ui`'s tokens — something has to download them. `src/components/FontLinks.astro` is the single place that does (weights + real italics), rendered by the standalone homepage's `<head>` and by the Starlight `components.Head` override (`src/components/Head.astro`, which wraps Starlight's own). Change weights/families there, not in a page. In `globals.css`, headings follow `--color-text` (via `--sl-color-white`, not Starlight's pure white) and use a scale set through Starlight's own `--sl-text-h1..h4` variables (h1 28px, stepping down); on entity pages (anything with the eyebrow) `h2` is restyled as a small mono caps section label, while chapters keep real headings. Stat cards (label/value rows) need `not-content` on the card — `not-prose` alone doesn't stop Starlight adding 1rem between rows.

## Styling

Don't add a local Tailwind theme or token file here. `src/styles/globals.css` imports `@cypher/ui/styles/globals.css` for tokens/Tailwind, then adds a small block mapping Starlight's own CSS variables (`--sl-color-accent`, `--sl-color-bg`, etc.) onto the shared tokens. If a new Starlight UI element needs theming, extend that mapping block rather than overriding Starlight's classes directly.
