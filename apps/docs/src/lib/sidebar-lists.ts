// The two sidebar groups too long to render into every page: 1,200+ Abilities
// and 166 Cyphers made up ~90% of each page's HTML and ~5,000 of its ~5,500
// DOM elements. Their entries live in one static file per list and locale
// instead (src/pages/sidebar-lists/[file].html.ts), which the browser caches
// once and src/components/Sidebar.astro inserts into the group after load —
// so every entry is still in the sidebar (and findable with Ctrl+F), without
// shipping it again on each of the site's ~3,400 pages.
//
// The file name carries a hash of its content, so vercel.json can cache it as
// immutable: a content change produces a new name, never a stale list.
import { createHash } from 'node:crypto'

import { getAllAbilities, getAllCyphers } from '@cypher/content'

import { pick, type UrlLocale } from './locale'

export const SIDEBAR_LISTS = ['abilities', 'cyphers'] as const
export type SidebarList = (typeof SIDEBAR_LISTS)[number]

const ENTRIES = {
  abilities: getAllAbilities,
  cyphers: getAllCyphers,
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * The list's `<li>` rows. Plain `<li><a>` on purpose: Starlight's own rows add
 * a <span> and a scoped class to each, a third more elements for no visual
 * difference (globals.css restates the few scoped rules they relied on).
 * Sorted by English name in both locales, like the other groups.
 */
export function sidebarListHtml(list: SidebarList, locale: UrlLocale): string {
  return ENTRIES[list]()
    .slice()
    .sort((a, b) => a.name.en.localeCompare(b.name.en))
    .map(
      (entry) =>
        `<li><a href="/${locale}/${list}/${entry.id}/">${escapeHtml(pick(entry.name, locale))}</a></li>`,
    )
    .join('')
}

// Sidebar.astro asks for the file name on every page of the build; the list
// (and so its hash) is the same each time, so it's computed once per file.
const fileNames = new Map<string, string>()

/** File name (without `.html`) under /sidebar-lists/, e.g. `en-abilities.3f9a0c1b2d4e`. */
export function sidebarListFile(list: SidebarList, locale: UrlLocale): string {
  const key = `${locale}-${list}`
  let name = fileNames.get(key)
  if (!name) {
    const hash = createHash('sha256')
      .update(sidebarListHtml(list, locale))
      .digest('hex')
      .slice(0, 12)
    name = `${key}.${hash}`
    fileNames.set(key, name)
  }
  return name
}
