import type { CharacterSheetLabels } from '@cypher/ui'

import type { Locale } from '@/lib/i18n/auth'

// Game terms shared with the wizard (stats, skill levels, price tiers…) live in
// lib/i18n/terms.ts. Terms marked UNCONFIRMED have no entry in the project
// glossary and are listed under "Needs confirmation" there.
export interface SheetCopy {
  labels: CharacterSheetLabels
  tier: string
  effort: string
  xp: string
  fromType: string
  fromFocus: string
  fromFlavor: string
  /** Marks an ability the character trained with the Skills advancement. */
  abilityTrained: string
  exportPdf: string
  edit: string
  play: string
  staleBanner: string
  invalidTitle: string
  invalidBody: string
  unavailable: string
  printed: string
  backToList: string
}

export const sheetCopy: Record<Locale, SheetCopy> = {
  en: {
    labels: {
      pools: 'Stat Pools',
      edge: 'Edge',
      skills: 'Skills',
      abilities: 'Abilities',
      inventory: 'Inventory',
      background: 'Background',
      printFooter: 'Cypher System Character Sheet',
    },
    tier: 'Tier',
    effort: 'Effort',
    xp: 'XP',
    fromType: 'Type',
    fromFocus: 'Focus',
    fromFlavor: 'Flavor',
    abilityTrained: 'Trained',
    exportPdf: 'Export as PDF',
    edit: 'Edit',
    play: 'Play',
    staleBanner: 'The rules reference has been updated since this character was created.',
    invalidTitle: 'This character needs attention',
    invalidBody:
      'Its choices no longer add up under the current rules. Open the editor to fix them.',
    unavailable: 'The rules service is unavailable right now. Please try again in a moment.',
    printed: 'Printed',
    backToList: '← My Characters',
  },
  'pt-br': {
    labels: {
      pools: 'Reservas', // Pool = Reserva (glossary); the mockup said "Conjuntos de Atributos"
      edge: 'Margem', // Edge = Margem (glossary); the mockup said "Vantagem"
      skills: 'Perícias',
      abilities: 'Habilidades',
      inventory: 'Inventário', // UNCONFIRMED
      background: 'Antecedentes', // UNCONFIRMED
      printFooter: 'Ficha de Personagem Cypher System',
    },
    tier: 'Grau', // Tier = Grau (glossary); the mockup said "Nível"
    effort: 'Esforço',
    xp: 'XP',
    fromType: 'Tipo',
    fromFocus: 'Foco',
    fromFlavor: 'Flavor', // UNCONFIRMED, see terms.flavor
    abilityTrained: 'Treinada',
    exportPdf: 'Exportar como PDF',
    edit: 'Editar',
    play: 'Jogar',
    staleBanner: 'A referência de regras foi atualizada desde a criação deste personagem.',
    invalidTitle: 'Este personagem precisa de atenção',
    invalidBody:
      'As escolhas dele não fecham mais com as regras atuais. Abra o editor para corrigi-las.',
    unavailable: 'O serviço de regras está indisponível no momento. Tente novamente em instantes.',
    printed: 'Impresso em',
    backToList: '← Meus Personagens',
  },
}
