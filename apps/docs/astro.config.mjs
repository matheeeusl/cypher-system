// @ts-check
import { defineConfig, fontProviders } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import starlight from '@astrojs/starlight'
import tailwindcss from '@tailwindcss/vite'

import {
  getAllTypes,
  getAllDescriptors,
  getAllAbilities,
  getAllFoci,
  getAllFlavors,
  getAllSkills,
  getAllCyphers,
  getAllArtifacts,
} from '@cypher/content'

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
  items: [
    // Links the group label's own category (src/pages/[locale]/types/index.astro)
    // — Starlight's manual sidebar has no way to make the group label itself a
    // link, so this is a plain leading item instead. Same on every group below.
    { label: 'Overview', translations: { 'pt-BR': 'Visão Geral' }, link: '/types/' },
    ...types.map((type) => ({
      label: type.name.en,
      translations: { 'pt-BR': type.name['pt-BR'] },
      link: `/types/${type.id}/`,
    })),
  ],
}

// Same manual-group pattern as Types, for the same reason: Descriptor pages
// (src/pages/[locale]/descriptors/[slug].astro) are also generated from
// @cypher/content rather than Starlight content-collection files.
const descriptors = getAllDescriptors()

const descriptorsSidebarGroup = {
  label: 'Descriptors',
  translations: { 'pt-BR': 'Descritores' },
  items: [
    { label: 'Overview', translations: { 'pt-BR': 'Visão Geral' }, link: '/descriptors/' },
    ...descriptors.map((descriptor) => ({
      label: descriptor.name.en,
      translations: { 'pt-BR': descriptor.name['pt-BR'] },
      link: `/descriptors/${descriptor.id}/`,
    })),
  ],
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
  items: [
    { label: 'Overview', translations: { 'pt-BR': 'Visão Geral' }, link: '/abilities/' },
    ...abilities.map((ability) => ({
      label: ability.name.en,
      translations: { 'pt-BR': ability.name['pt-BR'] },
      link: `/abilities/${ability.id}/`,
    })),
  ],
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
  items: [
    { label: 'Overview', translations: { 'pt-BR': 'Visão Geral' }, link: '/foci/' },
    ...foci.map((focus) => ({
      label: focus.name.en,
      translations: { 'pt-BR': focus.name['pt-BR'] },
      link: `/foci/${focus.id}/`,
    })),
  ],
}

// Flavors (src/pages/[locale]/flavors/[slug].astro): 2 so far, ten when all are
// transcribed — short enough to stay expanded, sorted like the Foci group.
// FLAVOR_TERM: the pt-BR label mirrors the term in src/lib/flavor-term.ts (this
// config can't import it), so change both together.
const flavors = getAllFlavors()
  .slice()
  .sort((a, b) => a.name.en.localeCompare(b.name.en))

const flavorsSidebarGroup = {
  label: 'Flavors',
  translations: { 'pt-BR': 'Traços' },
  items: [
    { label: 'Overview', translations: { 'pt-BR': 'Visão Geral' }, link: '/flavors/' },
    ...flavors.map((flavor) => ({
      label: flavor.name.en,
      translations: { 'pt-BR': flavor.name['pt-BR'] },
      link: `/flavors/${flavor.id}/`,
    })),
  ],
}

// Same manual-group pattern for Skills (src/pages/[locale]/skills/[slug].astro):
// 51 entries, the same size class as Descriptors/Foci, so alphabetical and
// left expanded like them.
const skills = getAllSkills()
  .slice()
  .sort((a, b) => a.name.en.localeCompare(b.name.en))

const skillsSidebarGroup = {
  label: 'Skills',
  translations: { 'pt-BR': 'Perícias' },
  items: [
    { label: 'Overview', translations: { 'pt-BR': 'Visão Geral' }, link: '/skills/' },
    ...skills.map((skill) => ({
      label: skill.name.en,
      translations: { 'pt-BR': skill.name['pt-BR'] },
      link: `/skills/${skill.id}/`,
    })),
  ],
}

// Same manual-group pattern, at a scale between Descriptors' 50 and
// Abilities' 965 — 166 Cyphers, closer to Abilities' situation than Foci's,
// so it gets the same treatment: sorted alphabetically and collapsed by
// default rather than dumping 166 links into the sidebar.
const cyphers = getAllCyphers()
  .slice()
  .sort((a, b) => a.name.en.localeCompare(b.name.en))

const cyphersSidebarGroup = {
  label: 'Cyphers',
  translations: { 'pt-BR': 'Cifras' },
  collapsed: true,
  items: [
    { label: 'Overview', translations: { 'pt-BR': 'Visão Geral' }, link: '/cyphers/' },
    ...cyphers.map((cypher) => ({
      label: cypher.name.en,
      translations: { 'pt-BR': cypher.name['pt-BR'] },
      link: `/cyphers/${cypher.id}/`,
    })),
  ],
}

// 15 Artifacts — bigger than Types' 4 but the same order of magnitude, so
// it follows the Types/Descriptors treatment: sorted alphabetically (cheap
// and consistent, even though 15 is short enough to scan in any order) and
// left expanded rather than collapsed.
const artifacts = getAllArtifacts()
  .slice()
  .sort((a, b) => a.name.en.localeCompare(b.name.en))

const artifactsSidebarGroup = {
  label: 'Artifacts',
  translations: { 'pt-BR': 'Artefatos' },
  items: [
    { label: 'Overview', translations: { 'pt-BR': 'Visão Geral' }, link: '/artifacts/' },
    ...artifacts.map((artifact) => ({
      label: artifact.name.en,
      translations: { 'pt-BR': artifact.name['pt-BR'] },
      link: `/artifacts/${artifact.id}/`,
    })),
  ],
}

// https://astro.build/config
export default defineConfig({
  // Canonical origin — enables the sitemap and absolute canonical URLs.
  site: 'https://csrd.app',
  // The design system's three families, downloaded from Google at build time
  // and served from this site (Astro's Fonts API) — a stylesheet on
  // fonts.googleapis.com blocked first paint by 1.5–2 s on mobile. Rendered by
  // src/components/FontLinks.astro; src/styles/globals.css points @cypher/ui's
  // --font-sans/--font-display/--font-mono at these variables.
  //
  // Weights are the ones the UI uses (Space Grotesk 500/600/700 headings,
  // Inter 400/500/600 body, IBM Plex Mono 400/500/600 chrome). Inter and Plex
  // Mono also get their real 400 italic — taglines and the "not transcribed"
  // notes are italic, and without it the browser fakes a slant. "latin"
  // covers Portuguese accents.
  fonts: [
    {
      name: 'Space Grotesk',
      cssVariable: '--font-space-grotesk',
      provider: fontProviders.google(),
      weights: [500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
    // Same name + cssVariable twice: Astro merges the entries, so only these
    // weight/style pairs download (not 500/600 italic too).
    {
      name: 'Inter',
      cssVariable: '--font-inter',
      provider: fontProviders.google(),
      weights: [400, 500, 600],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
    {
      name: 'Inter',
      cssVariable: '--font-inter',
      provider: fontProviders.google(),
      weights: [400],
      styles: ['italic'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
    {
      name: 'IBM Plex Mono',
      cssVariable: '--font-ibm-plex-mono',
      provider: fontProviders.google(),
      weights: [400, 500, 600],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['monospace'],
    },
    {
      name: 'IBM Plex Mono',
      cssVariable: '--font-ibm-plex-mono',
      provider: fontProviders.google(),
      weights: [400],
      styles: ['italic'],
      subsets: ['latin'],
      fallbacks: ['monospace'],
    },
  ],
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
    // Starlight adds this same sitemap itself unless one is configured; ours
    // repeats its i18n setup (the hreflang alternates) and adds a filter: the
    // root `/` is only a redirect (see src/pages/index.astro), and listed it
    // showed up as a second "en" alternate of /en/.
    sitemap({
      filter: (page) => page !== 'https://csrd.app/',
      i18n: { defaultLocale: 'en', locales: { en: 'en', 'pt-br': 'pt-BR' } },
    }),
    starlight({
      title: 'Cypher System Reference',
      customCss: ['./src/styles/globals.css'],
      // Applies the saved sidebar-collapsed state before first paint, the same
      // way Starlight's own ThemeProvider inlines the theme — otherwise a
      // collapsed sidebar would flash open on every navigation. The button
      // that flips it is src/components/SidebarToggle.astro; keep the storage
      // key in sync with that file.
      head: [
        {
          tag: 'script',
          content:
            "try{if(localStorage.getItem('cypher-sidebar-collapsed')==='1')document.documentElement.setAttribute('data-sidebar-collapsed','')}catch(e){}",
        },
      ],
      // Custom Header so Starlight-shell pages use the same bar as the
      // standalone homepage (src/components/SiteHeader.astro) — real
      // Pagefind search is the one deliberate difference, wired in
      // src/components/Header.astro.
      //
      // Head wraps Starlight's and adds the web-font links (see FontLinks.astro).
      //
      // TwoColumnContent and PageTitle wrap Starlight's own components to
      // add the breadcrumb above the content box and the entity-type
      // eyebrow above the title (both derived from the URL, see
      // src/lib/page-context.ts).
      //
      // Sidebar wraps it too, to list the current page's sections under its
      // menu entry (see Sidebar.astro); the menu's look is CSS in globals.css.
      //
      // Footer drops Starlight's own Previous/Next pagination (no mock has
      // one; see Footer.astro and BackButton.astro).
      components: {
        Head: './src/components/Head.astro',
        Header: './src/components/Header.astro',
        Sidebar: './src/components/Sidebar.astro',
        TwoColumnContent: './src/components/TwoColumnContent.astro',
        PageTitle: './src/components/PageTitle.astro',
        Footer: './src/components/Footer.astro',
      },
      // src/pages/404.astro is a standalone page (own header, no sidebar —
      // same pattern as the homepage) that replaces Starlight's own default
      // 404 route entirely; leaving Starlight's enabled too collides with
      // ours on the same "/404" pattern (Astro currently resolves in favor
      // of ours, but warns the collision becomes a hard error in a future
      // version).
      disable404Route: true,
      defaultLocale: 'en',
      locales: {
        en: { label: 'English', lang: 'en' },
        'pt-br': { label: 'Português (Brasil)', lang: 'pt-BR' },
      },
      sidebar: [
        {
          label: 'Rules',
          translations: { 'pt-BR': 'Regras' },
          items: [{ autogenerate: { directory: 'rules' } }],
        },
        typesSidebarGroup,
        descriptorsSidebarGroup,
        skillsSidebarGroup,
        abilitiesSidebarGroup,
        fociSidebarGroup,
        flavorsSidebarGroup,
        cyphersSidebarGroup,
        artifactsSidebarGroup,
        // A single fixed page (src/pages/[locale]/equipment/index.astro), not a
        // per-item category, so it's one link rather than a generated group.
        {
          label: 'Equipment',
          translations: { 'pt-BR': 'Equipamento' },
          link: '/equipment/',
        },
        // A single content-collection page (src/content/docs/<locale>/glossary.md),
        // not under rules/ (so it can't join the Rules autogenerate group) and
        // not a generated entity category — one manual link, same pattern as
        // Equipment above.
        {
          label: 'Glossary',
          translations: { 'pt-BR': 'Glossário' },
          link: '/glossary/',
        },
      ],
    }),
  ],
})
