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

## Content collections (this project)

Rules content lives under `src/content/docs/**`, organized into three sections that mirror the sidebar in `astro.config.mjs`: `rules/`, `guides/`, `reference/`. The `docs` collection (defined in `src/content.config.ts`) uses Starlight's own `docsLoader()` and `docsSchema()` — don't hand-roll a schema here; frontmatter fields (`title`, `description`, etc.) follow whatever Starlight's schema expects.

Adding a new page requires two edits, not one:
1. Add the `.md`/`.mdx` file under the right `src/content/docs/<section>/` folder.
2. Add a matching entry to the `sidebar` array in `astro.config.mjs` — the sidebar is hand-authored, not auto-generated from the file tree.

## Styling

Don't add a local Tailwind theme or token file here. `src/styles/globals.css` imports `@cypher/ui/styles/globals.css` for tokens/Tailwind, then adds a small block mapping Starlight's own CSS variables (`--sl-color-accent`, `--sl-color-bg`, etc.) onto the shared tokens. If a new Starlight UI element needs theming, extend that mapping block rather than overriding Starlight's classes directly.
