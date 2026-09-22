import { URL_LOCALES, type UrlLocale } from './locale'

// Chrome around a page's title (breadcrumb trail + the small "FOCUS"-style
// eyebrow above the h1) is derived from the URL rather than passed in by
// each page: every route on this site is /<locale>/<section>/<slug>/, so the
// section segment already says what kind of page this is. That keeps the
// entity pages, the Rules chapters and Equipment on one code path instead of
// each hand-rolling its own breadcrumb markup.
type Bilingual = Record<UrlLocale, string>

interface Section {
  // Middle breadcrumb label ("Home / <crumb> / Warrior").
  crumb: Bilingual
  // Eyebrow text above the title. Absent for narrative chapters, which are
  // plain reading pages, not entity references, and so get no eyebrow.
  kind?: Bilingual
  // True once the category has its own index page
  // (src/pages/[locale]/<section>/index.astro) listing every entity in it.
  // Lets Breadcrumbs.astro turn the middle crumb into a link, and lets
  // PageTitle.astro show the plural crumb (not the singular `kind`) as the
  // eyebrow on that index page itself. Equipment has no such flag: its
  // "section" *is* its one page, so `kind` ("Reference Table") is already
  // right there and nothing needs to change.
  hasIndex?: boolean
}

// Labels are UI chrome, not rulebook prose, so they live here rather than in
// @cypher/content. They match the strings the pages used before this moved
// into a shared component.
const SECTIONS: Record<string, Section> = {
  rules: { crumb: { en: 'Rules', 'pt-br': 'Regras' } },
  types: {
    crumb: { en: 'Types', 'pt-br': 'Tipos' },
    kind: { en: 'Type', 'pt-br': 'Tipo' },
    hasIndex: true,
  },
  descriptors: {
    crumb: { en: 'Descriptors', 'pt-br': 'Descritores' },
    kind: { en: 'Descriptor', 'pt-br': 'Descritor' },
    hasIndex: true,
  },
  abilities: {
    crumb: { en: 'Abilities', 'pt-br': 'Habilidades' },
    kind: { en: 'Ability', 'pt-br': 'Habilidade' },
    hasIndex: true,
  },
  skills: {
    crumb: { en: 'Skills', 'pt-br': 'Perícias' },
    kind: { en: 'Skill', 'pt-br': 'Perícia' },
    hasIndex: true,
  },
  foci: {
    crumb: { en: 'Foci', 'pt-br': 'Focos' },
    kind: { en: 'Focus', 'pt-br': 'Foco' },
    hasIndex: true,
  },
  cyphers: {
    crumb: { en: 'Cyphers', 'pt-br': 'Cifras' },
    kind: { en: 'Cypher', 'pt-br': 'Cifra' },
    hasIndex: true,
  },
  artifacts: {
    crumb: { en: 'Artifacts', 'pt-br': 'Artefatos' },
    kind: { en: 'Artifact', 'pt-br': 'Artefato' },
    hasIndex: true,
  },
  equipment: {
    crumb: { en: 'Equipment', 'pt-br': 'Equipamento' },
    kind: { en: 'Reference Table', 'pt-br': 'Tabela de Referência' },
  },
}

export const HOME_LABEL: Bilingual = { en: 'Home', 'pt-br': 'Início' }

export interface PageContext {
  locale: UrlLocale
  section: Section | undefined
  // Raw URL segment ("foci", "types", ...) — kept alongside the resolved
  // `section` so Breadcrumbs.astro can build `/<locale>/<segment>/` without
  // re-deriving it from the pathname itself.
  segment: string | undefined
  // True for /<locale>/<section>/<slug>/ (a page inside a section). False for
  // a single-page section like /<locale>/equipment/, where the section *is*
  // the page and a middle crumb would just repeat the title.
  isNested: boolean
}

// Returns undefined when the first path segment isn't a known locale (e.g.
// Starlight's own 404), so callers can render no chrome instead of guessing.
export function getPageContext(pathname: string): PageContext | undefined {
  const [first, sectionSegment, ...rest] = pathname.split('/').filter(Boolean)
  if (!first || !(URL_LOCALES as string[]).includes(first)) return undefined

  return {
    locale: first as UrlLocale,
    section: sectionSegment ? SECTIONS[sectionSegment] : undefined,
    segment: sectionSegment,
    isNested: rest.length > 0,
  }
}
