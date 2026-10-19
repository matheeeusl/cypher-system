# @cypher/ui

Shared React components and the **"Salvage Console"** design system: dark-first,
teal-on-graphite and utilitarian. Both front ends ([`apps/docs`](../../apps/docs/README.md) and
[`apps/app`](../../apps/app/README.md)) take their colors, fonts and Tailwind setup from here.

Part of the [Cypher System monorepo](../../README.md).

## Using it

One CSS import gives an app Tailwind CSS v4 and every design token:

```css
/* the app's global stylesheet */
@import '@cypher/ui/styles/globals.css';
```

Then use the components:

```tsx
import { Button, PoolMeter, CharacterSheet } from '@cypher/ui'
```

Components take all their text through props (usually a `labels` object), so the same component
works in English and Portuguese. They don't load fonts; each app does that (`next/font` in the
app, `FontLinks.astro` in the docs).

Two small non-React entry points let the Astro site share data without importing the
component bundle:

| Import              | What it is                                     |
| ------------------- | ---------------------------------------------- |
| `@cypher/ui/brand`  | `BRAND_PREFIX` (`CYPHER://`), used in top bars |
| `@cypher/ui/footer` | Footer text and links shared by both sites     |

## Design tokens

Tokens are CSS custom properties in [`src/styles/tokens.css`](src/styles/tokens.css). Dark is the
default; light applies when `<html>` has `data-theme="light"`. Print always uses the light
palette.

| Token         | Dark                    | Light     | Tailwind          |
| ------------- | ----------------------- | --------- | ----------------- |
| `bg`          | `#14181C`               | `#F2F4F4` | `bg-bg`           |
| `panel`       | `#232B31`               | `#F7F8F8` | `bg-panel`        |
| `text`        | `#D8E3E7`               | `#1A2226` | `text-text`       |
| `text-muted`  | `#7C8A90`               | `#5B6A70` | `text-text-muted` |
| `accent`      | `#4FB8B0`               | `#0F6E56` | `bg-accent`, …    |
| `accent-soft` | `rgba(79,184,176,0.12)` | `#DCEEEA` | `bg-accent-soft`  |
| `warning`     | `#C97B4A`               | `#A85A2E` | `text-warning`, … |
| `border`      | `#2B333A`               | `#D7DBDC` | `border-border`   |

Fonts: **Space Grotesk** for headings (`font-display`), **Inter** for body text (`font-sans`) and
**IBM Plex Mono** for stat blocks, buttons and other UI chrome (`font-mono`).

[`src/styles/globals.css`](src/styles/globals.css) maps the tokens to Tailwind utilities in a v4
`@theme` block; there is no `tailwind.config.js`. Since the utilities point at CSS variables,
switching theme is only a matter of toggling the attribute; no component changes its classes.

Use the tokens, never hex values, in components.

## Components

| Area       | Components                                                                               |
| ---------- | ---------------------------------------------------------------------------------------- |
| Basics     | `Button`, `LinkButton`, `TextField`, `Alert`, `Tabs`, `Pagination`, `ConfirmDialog`      |
| Auth       | `AuthCard`, `AuthForm`, `ResetPasswordForm`, `SocialButton`                              |
| Characters | `CharacterCard`, `CharacterList`, `CharacterSheet`                                       |
| Play mode  | `PoolMeter`, `ConditionBanner`, `XpLog`, `NotesLog`, `InventoryList`, `AdvancementPanel` |
| Pickers    | `ChipPicker`, `AbilityPicker`, `PoolSplitPicker`, `CypherPicker`                         |

`LinkProvider` lets an app hand in its own link component (such as Next.js's `Link`) so the
components here stay framework-free.

## Storybook

```sh
pnpm storybook   # from the repo root → http://localhost:6006
```

Stories sit next to their components (`src/*.stories.tsx`), and the a11y addon is enabled.
Stories render in the dark theme.

## Scripts

| Script            | What it does           |
| ----------------- | ---------------------- |
| `build`           | Compile to `dist/`     |
| `typecheck`       | `tsc --noEmit`         |
| `lint`            | ESLint over `src/`     |
| `storybook`       | Storybook dev server   |
| `build-storybook` | Static Storybook build |
