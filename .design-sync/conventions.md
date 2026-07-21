# Cypher System UI — "Salvage Console"

Dark-first, teal/graphite, utilitarian TTRPG reference/character-sheet UI. Theme is switched by toggling `[data-theme="light"]` on the root element — dark is the default with no attribute needed. Every color and font below is a CSS custom property that updates automatically when that attribute flips; never hardcode a hex value.

## Setup

No provider or wrapper component is required — components render standalone. Just make sure the page (or its root element) can see the shipped `styles.css`, which pulls in the token variables, fonts, and compiled component styles:

```html
<link rel="stylesheet" href="styles.css">
```

To render in light mode, set `data-theme="light"` on `<html>` (or any ancestor); omit it for dark.

## Styling idiom — two vocabularies, don't mix them up

This DS compiles CSS with Tailwind v4, but **only the utility classes existing components actually use get shipped** (JIT compilation against a very small source tree — right now just `Button`). There is no live Tailwind compiler at runtime, so inventing a Tailwind class this bundle hasn't already produced (e.g. `bg-warning`, `p-6`, `gap-4`) will silently do nothing — it won't exist in the shipped CSS.

**Two safe ways to style anything new:**

1. **Reuse the exact classes already shipped** (safe because they're proven to exist): `rounded`, `px-4`, `py-2`, `font-mono`, `font-semibold`, `border`, `cursor-pointer`, `transition-colors`, `hover:opacity-90`, plus the color utilities `bg-accent`, `text-bg`, `bg-panel`, `text-text-muted`, `border-border`.
2. **For anything else — new layout, spacing, or a color utility not in that list — style with the raw CSS variables directly** (these always exist, unconditionally, regardless of what Tailwind compiled):

   | Variable | Dark | Light |
   |---|---|---|
   | `--color-bg` | `#14181C` | `#F2F4F4` |
   | `--color-panel` | `#232B31` | `#F7F8F8` |
   | `--color-text` | `#D8E3E7` | `#1A2226` |
   | `--color-text-muted` | `#7C8A90` | `#5B6A70` |
   | `--color-accent` | `#4FB8B0` | `#0F6E56` |
   | `--color-warning` | `#C97B4A` | `#A85A2E` |
   | `--color-border` | `#2B333A` | `#D7DBDC` |
   | `--font-sans` | `'Inter', ...` (body text) | |
   | `--font-mono` | `'IBM Plex Mono', ...` (stat blocks, buttons, UI chrome) | |

   Note: `--font-display` ('Space Grotesk', for headings) is declared in the source design system but isn't present in this shipped CSS yet — no synced component uses it, so Tailwind's build dropped it. It will appear once a component that uses `font-display` (e.g. a Heading) is added and synced. Don't reference it until then.

   e.g. `style={{ background: 'var(--color-panel)', color: 'var(--color-text-muted)' }}` for a new panel, or a `<style>` block using `var(--color-border)` for a divider.

There is only one panel surface — `--color-panel` — used for cards, modals, and secondary/inset UI alike (toggle buttons, tab bars). It's a single shared shade; don't invent a second panel tone.

## Where the truth lives

- `styles.css` (imports `fonts/fonts.css` then `_ds_bundle.css`) — the full compiled stylesheet, including the raw `:root` / `[data-theme="light"]` variable declarations above.
- `components/<group>/<Name>/<Name>.prompt.md` — per-component usage notes and prop shapes.

## Example

```jsx
<Button label="Roll for Initiative" variant="primary" />
<Button label="Cancel" variant="ghost" />
```

Both variants use `font-mono` (IBM Plex Mono) — this design system uses mono type for all interactive controls, not just stat blocks.
