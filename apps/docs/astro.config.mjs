// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import tailwindcss from '@tailwindcss/vite'

import { getAllTypes, getAllDescriptors, getAllAbilities, getAllFoci } from '@cypher/content'

// Manual sidebar group for Type reference pages. These pages are generated
// from @cypher/content (src/pages/[locale]/types/[slug].astro), not Starlight
// content-collection files, so they can't use `autogenerate`.
//
// Links are locale-neutral (no locale prefix) — Starlight's manual-sidebar
// renderer injects the *current page's* locale onto `link` unconditionally,
// so a link that already included a locale would be double-prefixed
// (e.g. `/en/en/types/warrior/`). Per-locale label text goes in
// `translations` instead, keyed by the `lang` set below.
const types = getAllTypes()

const typesSidebarGroup = {
  label: 'Types',
  translations: { 'pt-BR': 'Tipos' },
  items: types.map((type) => ({
    label: type.name.en,
    translations: { 'pt-BR': type.name['pt-BR'] },
    link: `/types/${type.id}/`,
  })),
}

// Same manual-group pattern as Types, for the same reason: Descriptor pages
// (src/pages/[locale]/descriptors/[slug].astro) are also generated from
// @cypher/content rather than Starlight content-collection files.
const descriptors = getAllDescriptors()

const descriptorsSidebarGroup = {
  label: 'Descriptors',
  translations: { 'pt-BR': 'Descritores' },
  items: descriptors.map((descriptor) => ({
    label: descriptor.name.en,
    translations: { 'pt-BR': descriptor.name['pt-BR'] },
    link: `/descriptors/${descriptor.id}/`,
  })),
}

// Same manual-group pattern again, but at a very different scale: 965
// Abilities vs. Types' 4 or Descriptors' 50. Two adjustments that only
// matter at this size:
// - `collapsed: true` (Starlight's own manual-sidebar option) so the group
//   doesn't dump 965 links into the sidebar by default — Types/Descriptors
//   stay expanded since they're short enough to just scan.
// - An explicit alphabetical sort. getAllTypes()/getAllDescriptors() were
//   used in filesystem read order, which was fine for a handful of items;
//   at 965 that order isn't guaranteed to look intentional, so this group
//   sorts by English name instead of trusting directory order.
const abilities = getAllAbilities()
  .slice()
  .sort((a, b) => a.name.en.localeCompare(b.name.en))

const abilitiesSidebarGroup = {
  label: 'Abilities',
  translations: { 'pt-BR': 'Habilidades' },
  collapsed: true,
  items: abilities.map((ability) => ({
    label: ability.name.en,
    translations: { 'pt-BR': ability.name['pt-BR'] },
    link: `/abilities/${ability.id}/`,
  })),
}

// Same manual-group pattern, at a scale between Descriptors' 50 and
// Abilities' 965 — 50 Foci, so sorted alphabetically like Abilities for
// the same directory-order-isn't-intentional-at-this-size reason, but left
// expanded like Types/Descriptors since 50 is still short enough to scan.
const foci = getAllFoci()
  .slice()
  .sort((a, b) => a.name.en.localeCompare(b.name.en))

const fociSidebarGroup = {
  label: 'Foci',
  translations: { 'pt-BR': 'Focos' },
  items: foci.map((focus) => ({
    label: focus.name.en,
    translations: { 'pt-BR': focus.name['pt-BR'] },
    link: `/foci/${focus.id}/`,
  })),
}

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    // @cypher/content's loader locates its YAML directory relative to its
    // own compiled file (import.meta.url), which only resolves correctly
    // when the package is loaded from its real node_modules/dist location.
    // Astro's static build otherwise inlines it into a prerender chunk at
    // a different path, breaking that lookup — keep it external instead.
    ssr: {
      external: ['@cypher/content'],
    },
    build: {
      rollupOptions: {
        external: ['@cypher/content'],
      },
    },
  },
  integrations: [
    starlight({
      title: 'Cypher System Reference',
      customCss: ['./src/styles/globals.css'],
      // Custom Header so Starlight-shell pages use the same bar as the
      // standalone homepage (src/components/SiteHeader.astro) — real
      // Pagefind search is the one deliberate difference, wired in
      // src/components/Header.astro.
      components: {
        Header: './src/components/Header.astro',
      },
      defaultLocale: 'en',
      locales: {
        en: { label: 'English', lang: 'en' },
        'pt-br': { label: 'Português (Brasil)', lang: 'pt-BR' },
      },
      sidebar: [
        {
          label: 'Rules',
          items: [{ autogenerate: { directory: 'rules' } }],
        },
        typesSidebarGroup,
        descriptorsSidebarGroup,
        abilitiesSidebarGroup,
        fociSidebarGroup,
      ],
    }),
  ],
})
