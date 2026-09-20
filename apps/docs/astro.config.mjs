// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import tailwindcss from '@tailwindcss/vite'

import { getAllTypes, getAllDescriptors } from '@cypher/content'

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
      ],
    }),
  ],
})
