---
name: front-end-skill
description: Tailwind + CSS-variable token pattern, Storybook conventions, and shared UI component structure for the "Salvage Console" design system in packages/ui. Use when building or styling any component in packages/ui, or when consuming @cypher/ui from an app.
---

# Front-end conventions — packages/ui

Everything visual in this monorepo flows through `packages/ui`. Both apps import one file (`@cypher/ui/styles/globals.css`) to get Tailwind, the design tokens, and the theme switch — components should never redefine colors, fonts, or theme logic locally.

## The token chain

Three layers, in this order, and each has one job:

1. **`src/styles/tokens.css`** — raw CSS custom properties. Dark is the `:root` default; light is a full override under `[data-theme="light"]`. This is the *only* place a color's hex value should ever be written.
2. **`src/styles/globals.css`** — `@import "tailwindcss"` + `@import "./tokens.css"`, then a Tailwind v4 `@theme` block that maps each `--color-*` custom property to a Tailwind theme key (so `bg-bg`, `text-text`, `border-border`, etc. exist as utilities), plus the three `--font-*` mappings.
3. **Consumers** (apps, and components inside `packages/ui` itself) import `@cypher/ui/styles/globals.css` once, at the root. Never import `tokens.css` directly from a component.

Theme switching is just toggling `[data-theme="light"]` on `<html>` — because everything downstream reads the CSS variable, not a hardcoded value, no component needs to know a theme switch happened.

**Referencing tokens in a component:** use the CSS-variable arbitrary-value syntax, matching `Button.tsx`:

```tsx
'bg-[--color-accent] text-[--color-bg] hover:opacity-90'
'border border-[--color-border] text-[--color-text] hover:bg-[--color-panel]'
```

Never hardcode a hex value or a raw Tailwind palette color (`bg-teal-500`, `#4FB8B0`, etc.) inside a component — if a color you need doesn't have a token yet, add it to `tokens.css` (both the dark and light blocks) first, then reference it the same way.

## Storybook conventions

Every component gets a co-located story file: `ComponentName.stories.tsx` next to `ComponentName.tsx`. Follow `Button.stories.tsx` as the template:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ComponentName } from './ComponentName'

const meta: Meta<typeof ComponentName> = {
  component: ComponentName,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ComponentName>

export const Default: Story = {
  args: { /* ... */ },
}
```

- Always include `tags: ['autodocs']` — docs pages are generated from this, not hand-written.
- Add one story per meaningfully distinct visual state (each `variant`, disabled/loading states, etc.) rather than one story with a busy controls panel — see `Primary`/`Ghost` in `Button.stories.tsx`.
- `.storybook/preview.tsx` already imports `src/styles/globals.css` globally, so stories render with real tokens and theme support — don't re-import styles in individual story files.
- The a11y addon parameter (`a11y: { test: 'todo' }` in preview) means accessibility checks currently warn, not fail. Don't quietly tighten this to `'error'` per-story without deciding that project-wide.

## Structuring a new shared component

1. **File**: `packages/ui/src/ComponentName.tsx`. One component per file, matching the exported name.
2. **Props**: a local `interface ComponentNameProps` above the component (see `ButtonProps`). Use a union type for variants (`variant?: 'primary' | 'ghost'`), not a string, and give it a sensible default in the destructured params rather than checking for `undefined` in the body.
3. **Styling**: build the class string from a `base` string plus a `variants` lookup object keyed by the variant union, exactly like `Button.tsx` — this keeps every variant's classes readable in one place instead of scattered conditionals.
4. **No framework imports beyond React.** Nothing from Next.js, Astro, or Supabase belongs in `packages/ui` — these components must render identically in both apps and in Storybook.
5. **Export it**: add `export { ComponentName } from './ComponentName'` to `src/index.ts`. A component that isn't re-exported here isn't usable from `@cypher/ui` in either app.
6. **Story**: add the co-located `.stories.tsx` file (see above) in the same commit — a shared component without a story isn't considered done in this project.
