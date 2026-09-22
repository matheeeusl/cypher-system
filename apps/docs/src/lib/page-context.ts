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
}

// Labels are UI chrome, not rulebook prose, so they live here rather than in
// @cypher/content. They match the strings the pages used before this moved
// into a shared component.
const SECTIONS: Record<string, Section> = {
  rules: { crumb: { en: 'Rules', 'pt-br': 'Regras' } },
  types: {
    crumb: { en: 'Types', 'pt-br': 'Tipos' },
    kind: { en: 'Type', 'pt-br': 'Tipo' },
  },
  descriptors: {
    crumb: { en: 'Descriptors', 'pt-br': 'Descritores' },
    kind: { en: 'Descriptor', 'pt-br': 'Descritor' },
  },
  abilities: {
    crumb: { en: 'Abilities', 'pt-br': 'Habilidades' },
    kind: { en: 'Ability', 'pt-br': 'Habilidade' },
  },
  skills: {
    crumb: { en: 'Skills', 'pt-br': 'Perícias' },
    kind: { en: 'Skill', 'pt-br': 'Perícia' },
  },
  foci: {
    crumb: { en: 'Foci', 'pt-br': 'Focos' },
    kind: { en: 'Focus', 'pt-br': 'Foco' },
  },
  cyphers: {
    crumb: { en: 'Cyphers', 'pt-br': 'Cifras' },
    kind: { en: 'Cypher', 'pt-br': 'Cifra' },
  },
  artifacts: {
    crumb: { en: 'Artifacts', 'pt-br': 'Artefatos' },
    kind: { en: 'Artifact', 'pt-br': 'Artefato' },
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
    isNested: rest.length > 0,
  }
}
