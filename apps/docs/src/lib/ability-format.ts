import type { Ability } from '@cypher/content'
import type { UrlLocale } from './locale'

// Display text for an Ability's cost and action type, shared by the Ability
// page (its Cost / Action Type table) and the Focus page (the one-line meta
// under each tier ability). Labels are UI chrome, not rulebook prose, so they
// live here rather than in @cypher/content.
const pt = (locale: UrlLocale) => locale === 'pt-br'

const STAT_LABELS: Record<'might' | 'speed' | 'intellect', [string, string]> = {
  might: ['Might', 'Força'],
  speed: ['Speed', 'Velocidade'],
  intellect: ['Intellect', 'Intelecto'],
}

// action_type is a fixed 28-value rulebook-derived enum (@cypher/content's
// AbilitySchema). This Record is keyed by Ability['action_type'] itself, so
// TS fails typecheck if the enum ever gains a value this table doesn't cover,
// instead of silently falling back to the raw id at runtime.
const ACTION_TYPE_LABELS: Record<Ability['action_type'], [string, string]> = {
  action: ['Action', 'Ação'],
  enabler: ['Enabler', 'Habilitador'],
  action_to_initiate: ['Action to initiate', 'Ação para iniciar'],
  action_to_initiate_or_reinitiate: [
    'Action to initiate or reinitiate',
    'Ação para iniciar ou reiniciar',
  ],
  action_or_enabler: ['Action or enabler', 'Ação ou habilitador'],
  action_to_establish: ['Action to establish', 'Ação para estabelecer'],
  action_to_establish_contact: ['Action to establish contact', 'Ação para estabelecer contato'],
  action_to_animate: ['Action to animate', 'Ação para animar'],
  action_to_manifest: ['Action to manifest', 'Ação para manifestar'],
  action_to_teleport: ['Action to teleport', 'Ação para teletransportar'],
  action_to_change_or_revert: ['Action to change or revert', 'Ação para mudar ou reverter'],
  action_to_enter_or_exit: ['Action to enter or exit', 'Ação para entrar ou sair'],
  action_to_split_or_recombine: ['Action to split or recombine', 'Ação para dividir ou recombinar'],
  action_to_create: ['Action to create', 'Ação para criar'],
  action_to_create_and_check: ['Action to create and check', 'Ação para criar e verificar'],
  action_to_create_and_direct: ['Action to create and direct', 'Ação para criar e direcionar'],
  action_to_produce_and_consume: ['Action to produce and consume', 'Ação para produzir e consumir'],
  action_to_initiate_and_complete: [
    'Action to initiate and complete',
    'Ação para iniciar e completar',
  ],
  action_to_initiate_and_animate: ['Action to initiate and animate', 'Ação para iniciar e animar'],
  action_to_initiate_and_concentrate: [
    'Action to initiate and concentrate',
    'Ação para iniciar e concentrar',
  ],
  action_to_initiate_and_direct_per_round: [
    'Action to initiate, then direct each round',
    'Ação para iniciar e direcionar a cada rodada',
  ],
  action_to_enter_and_traverse: ['Action to enter and traverse', 'Ação para entrar e atravessar'],
  action_to_initiate_and_call: ['Action to initiate and call', 'Ação para iniciar e invocar'],
  action_to_create_and_modify: ['Action to create and modify', 'Ação para criar e modificar'],
  action_to_initiate_and_drain: ['Action to initiate and drain', 'Ação para iniciar e drenar'],
  action_to_change: ['Action to change', 'Ação para mudar'],
  action_to_change_back: ['Action to change back', 'Ação para reverter'],
  action_to_activate: ['Action to activate', 'Ação para ativar'],
  action_per_target_to_initiate: ['Action per target to initiate', 'Ação por alvo para iniciar'],
  action_to_prepare_and_initiate: [
    'Action to prepare; action to initiate',
    'Ação para preparar; ação para iniciar',
  ],
}

// English puts the stat before "point(s)" ("4 Intellect points"); Portuguese
// puts it after, with "de" ("4 pontos de Intelecto") — same reordering the
// Types page already does for its equipmentText, not composable word-by-word.
// Returns null for an ability with no cost, so each caller decides how to say
// "none" (the Ability page prints "None"; the Focus page just omits it).
export function formatAbilityCost(cost: Ability['cost'], locale: UrlLocale): string | null {
  if (!cost) return null
  const label = STAT_LABELS[cost.pool]
  return pt(locale)
    ? `${cost.amount} ${cost.amount === 1 ? 'ponto' : 'pontos'} de ${label[1]}`
    : `${cost.amount} ${label[0]} ${cost.amount === 1 ? 'point' : 'points'}`
}

export function formatActionType(actionType: Ability['action_type'], locale: UrlLocale): string {
  return ACTION_TYPE_LABELS[actionType][pt(locale) ? 1 : 0]
}
