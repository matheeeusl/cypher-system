import type { Locale } from '@/lib/i18n/auth'

// Game terms: lib/i18n/terms.ts for ones shared with the wizard/sheet. Damage
// track names and effects follow apps/docs' recovery-and-healing chapter (the
// rules source of truth), with the glossary's pt-br spellings. Terms marked
// UNCONFIRMED have no glossary entry — see "Needs confirmation" there.

export type CypherCategoryKey = 'MANIFEST' | 'FANTASTIC' | 'SUBTLE' | 'POWER_BOOST'
export type ConditionKey = 'hale' | 'impaired' | 'debilitated' | 'dead'
export type AdvancementKey = 'pools' | 'edge' | 'effort' | 'skills'

export interface PlayCopy {
  title: string
  backToSheet: string
  tabs: { status: string; skills: string; inventory: string; log: string }
  chips: { tier: (n: number) => string; effort: (n: number) => string }
  pools: {
    title: string
    effort: string
    edge: string
    spend: string
    recover: string
    recoverFull: string
    amount: string
  }
  conditions: Record<ConditionKey, { label: string; note: string }>
  advancement: {
    title: string
    summary: (purchased: number, perTier: number, xp: number) => string
    description: (cost: number, perTier: number) => string
    steps: Record<AdvancementKey, string>
    purchased: string
    cost: (xp: number) => string
    needs: (xp: number) => string
    purchase: string
    unavailable: string
    addPoolsTo: string
    poolsRemaining: (n: number) => string
    confirm: string
    addTo: string
    removeFrom: string
    addEdgeTo: string
    edgeOption: (name: string, from: number, to: number) => string
    skillSearch: string
    skillOption: (name: string, from: string, to: string) => string
    skillMaxed: (name: string) => string
    /** Offered while typing a skill that isn't listed. */
    skillNew: (name: string) => string
    abilityOption: (name: string) => string
    abilityTrained: (name: string) => string
    cancel: string
    tierUp: (tier: number) => string
    dismiss: string
    capped: string
    errors: { insufficient: string; conflict: string; capped: string; generic: string }
  }
  picks: {
    typeTitle: (tier: number) => string
    focusTitle: (tier: number) => string
    /** Skills an ability trains the character in, gained at `tier`. */
    skillTitle: (abilityName: string, tier: number) => string
    /** Hint for an ability that takes two pick counts ("two skills, or one specialized"). */
    skillAlternateHint: (selected: number, required: number, alternate: number) => string
    customPlaceholder: string
    customAdd: string
    hint: (selected: number, required: number) => string
    confirm: string
    error: string
  }
  skills: { skills: string; abilities: string }
  log: {
    xpLog: (total: number) => string
    reasonPlaceholder: string
    gain: string
    spend: string
    add: string
    empty: string
    remove: string
    notes: string
    notesPlaceholder: string
    saving: string
    saved: string
    errors: {
      insufficient: string
      locked: string
      wouldGoNegative: string
      limit: string
      generic: string
    }
  }
  inventory: {
    title: string
    cypherCount: (count: number, limit: number) => string
    overLimit: (limit: number) => string
    browseHint: string
    browse: string
    search: string
    shown: (n: number) => string
    close: string
    all: string
    categories: Record<CypherCategoryKey, string>
    noResults: string
    level: (level: string) => string
    addToInventory: string
    loading: string
    loadFailed: string
    itemName: string
    itemMeta: string
    add: string
    decrease: string
    increase: string
    remove: string
    cypherMeta: (category: string, level: string) => string
    itemDefaultMeta: string
    errors: { limit: string; generic: string }
  }
  saveFailed: string
  /** Shown while changes are still being sent to the server. */
  syncing: string
}

const en: PlayCopy = {
  title: 'PLAY',
  backToSheet: '← Character sheet',
  tabs: {
    status: 'Status',
    skills: 'Skills & Abilities',
    inventory: 'Inventory',
    log: 'Log & Notes',
  },
  chips: { tier: (n) => `Tier ${n}`, effort: (n) => `Effort ${n}` },
  pools: {
    title: 'Stat Pools',
    effort: 'Effort',
    edge: 'Edge',
    spend: 'Spend',
    recover: 'Recover',
    recoverFull: 'Full recovery',
    amount: 'Amount',
  },
  conditions: {
    hale: { label: 'Hale', note: 'Your normal, healthy state.' },
    impaired: {
      label: 'Impaired',
      note: 'One stat Pool at 0. Each level of Effort costs 1 more, and you ignore minor and major effects when rolling (only up to +1 damage on a 17–20).',
    },
    debilitated: {
      label: 'Debilitated',
      note: 'Two stat Pools at 0. You can only move an immediate distance — probably crawl. With Speed at 0, you can’t move.',
    },
    dead: { label: 'Dead', note: 'All three stat Pools at 0. Dead is dead.' },
  },
  advancement: {
    title: 'Character Advancement',
    summary: (purchased, perTier, xp) => `${purchased} / ${perTier} steps · ${xp} XP available`,
    description: (cost, perTier) =>
      `Each step costs ${cost} XP. Purchase all ${perTier}, in any order, to advance to the next tier.`,
    steps: {
      pools: 'Increasing Capabilities — +4 stat Pool points',
      edge: 'Moving Toward Perfection — +1 Edge',
      effort: 'Extra Effort — +1 Effort',
      skills: 'Skills — train a skill',
    },
    purchased: 'Purchased',
    cost: (xp) => `${xp} XP`,
    needs: (xp) => `Needs ${xp} XP`,
    purchase: 'Purchase',
    unavailable: 'Not available yet',
    addPoolsTo: 'Split +4 points among your Pools:',
    poolsRemaining: (n) => `${n} left`,
    confirm: 'Confirm',
    addTo: 'Add to',
    removeFrom: 'Remove from',
    addEdgeTo: 'Add +1 Edge to:',
    edgeOption: (name, from, to) => `${name} (${from} → ${to})`,
    skillSearch: 'Search skills — any skill can be trained, even ones you already have',
    skillOption: (name, from, to) => `${name} (${from} → ${to})`,
    skillMaxed: (name) => `${name} — Specialized (maxed)`,
    skillNew: (name) => `Train “${name}” as a new skill`,
    abilityOption: (name) => `${name} — ability (train)`,
    abilityTrained: (name) => `${name} — ability, already trained`,
    cancel: 'Cancel',
    tierUp: (tier) => `✓ Advanced to Tier ${tier} — all four steps purchased.`,
    dismiss: 'Dismiss',
    capped: 'You have reached the highest tier (6) — there is nothing left to buy.',
    errors: {
      insufficient: 'Not enough XP.',
      conflict: 'This character changed somewhere else. Reload the page and try again.',
      capped: 'You are already at the highest tier.',
      generic: 'Could not apply the advancement. Please try again.',
    },
  },
  picks: {
    typeTitle: (tier) => `Tier ${tier} — choose your Type abilities`,
    focusTitle: (tier) => `Tier ${tier} — choose a Focus ability`,
    skillTitle: (abilityName, tier) =>
      `${abilityName} (tier ${tier}) — choose the skills it improves`,
    skillAlternateHint: (selected, required, alternate) =>
      `Choose ${required}, or ${alternate} to specialize in a skill you already know — ${selected} selected`,
    customPlaceholder: 'Or type your own…',
    customAdd: 'Add',
    hint: (selected, required) => `Choose ${required} — ${selected} selected`,
    confirm: 'Confirm choices',
    error: 'Could not save these choices. Reload the page and try again.',
  },
  skills: { skills: 'Skills', abilities: 'Abilities' },
  log: {
    xpLog: (total) => `XP Log · ${total} XP`,
    reasonPlaceholder: 'Description (e.g. GM intrusion, milestone)',
    gain: 'Gain',
    spend: 'Spend',
    add: 'Add',
    empty: 'No XP recorded yet this session.',
    remove: 'Remove entry',
    notes: 'Notes',
    notesPlaceholder: 'Session notes, reminders, loose threads…',
    saving: 'Saving…',
    saved: 'Saved',
    errors: {
      insufficient: 'Not enough XP to spend that much.',
      locked: 'That entry paid for an advancement and can’t be removed.',
      wouldGoNegative: 'Removing it would leave XP below zero.',
      limit: 'The XP log is full.',
      generic: 'Could not update the XP log. Please try again.',
    },
  },
  inventory: {
    title: 'Carried Cyphers & Equipment',
    cypherCount: (count, limit) => `Cyphers ${count} / ${limit}`,
    overLimit: (limit) =>
      `You carry more cyphers than your limit of ${limit}. The GM may let you exceed it at some cost.`,
    browseHint: 'Browse the cypher catalog to add a real one to inventory.',
    browse: 'Browse Cyphers',
    search: 'Search cyphers…',
    shown: (n) => `${n} shown`,
    close: 'Close',
    all: 'All',
    categories: {
      MANIFEST: 'Manifest',
      FANTASTIC: 'Fantastic',
      SUBTLE: 'Subtle',
      POWER_BOOST: 'Power Boost',
    },
    noResults: 'No cyphers match your search.',
    level: (level) => `Level: ${level}`,
    addToInventory: '+ Add to Inventory',
    loading: 'Loading cyphers…',
    loadFailed: 'Couldn’t load the cypher catalog.',
    itemName: 'Item name',
    itemMeta: 'Detail (e.g. Weapon · 4 dmg)',
    add: 'Add',
    decrease: 'Decrease quantity',
    increase: 'Increase quantity',
    remove: 'Remove item',
    cypherMeta: (category, level) => `Cypher · ${category} · Level ${level}`,
    itemDefaultMeta: 'Gear',
    errors: {
      limit: 'The inventory is full.',
      generic: 'Could not update the inventory. Please try again.',
    },
  },
  saveFailed: 'Could not save your last change. Reload the page to see the saved state.',
  syncing: 'Syncing…',
}

const ptBr: PlayCopy = {
  title: 'PLAY',
  backToSheet: '← Ficha do personagem',
  tabs: {
    status: 'Status',
    skills: 'Perícias e Habilidades',
    inventory: 'Inventário', // UNCONFIRMED
    log: 'Registro e Notas',
  },
  chips: { tier: (n) => `Grau ${n}`, effort: (n) => `Esforço ${n}` },
  pools: {
    title: 'Reservas',
    effort: 'Esforço',
    edge: 'Margem',
    spend: 'Gastar',
    recover: 'Recuperar',
    recoverFull: 'Recuperação total',
    amount: 'Quantidade',
  },
  conditions: {
    hale: { label: 'Íntegro', note: 'Seu estado normal e saudável.' }, // UNCONFIRMED (docs use "Íntegro")
    impaired: {
      label: 'Enfraquecido',
      note: 'Uma Reserva de atributo em 0. Cada nível de Esforço custa 1 a mais, e você ignora efeitos menores e maiores ao rolar (apenas até +1 de dano em 17 a 20).',
    },
    debilitated: {
      label: 'Debilitado',
      note: 'Duas Reservas de atributo em 0. Você só pode mover-se uma distância imediata — provavelmente rastejando. Com a Velocidade em 0, você não pode se mover.',
    },
    dead: { label: 'Morto', note: 'Todas as três Reservas de atributo em 0. Morto é morto.' },
  },
  advancement: {
    title: 'Avanço do Personagem', // UNCONFIRMED (docs: "avanço de personagem")
    summary: (purchased, perTier, xp) => `${purchased} / ${perTier} etapas · ${xp} XP disponíveis`,
    description: (cost, perTier) =>
      `Cada etapa custa ${cost} XP. Compre as ${perTier}, em qualquer ordem, para avançar ao próximo Grau.`,
    steps: {
      pools: 'Aumentando Capacidades — +4 pontos nas Reservas',
      edge: 'Caminho para a Perfeição — +1 Margem',
      effort: 'Esforço Extra — +1 Esforço',
      skills: 'Perícias — treinar uma perícia',
    },
    purchased: 'Comprado',
    cost: (xp) => `${xp} XP`,
    needs: (xp) => `Requer ${xp} XP`,
    purchase: 'Comprar',
    unavailable: 'Ainda indisponível',
    addPoolsTo: 'Divida +4 pontos entre as Reservas:',
    poolsRemaining: (n) => `${n} restantes`,
    confirm: 'Confirmar',
    addTo: 'Adicionar a',
    removeFrom: 'Remover de',
    addEdgeTo: 'Adicionar +1 de Margem a:',
    edgeOption: (name, from, to) => `${name} (${from} → ${to})`,
    skillSearch: 'Buscar perícias — qualquer perícia pode ser treinada, até as que você já tem',
    skillOption: (name, from, to) => `${name} (${from} → ${to})`,
    skillMaxed: (name) => `${name} — Especializado (máximo)`,
    skillNew: (name) => `Treinar “${name}” como nova perícia`,
    abilityOption: (name) => `${name} — habilidade (treinar)`,
    abilityTrained: (name) => `${name} — habilidade, já treinada`,
    cancel: 'Cancelar',
    tierUp: (tier) => `✓ Avançou para o Grau ${tier} — as quatro etapas foram compradas.`,
    dismiss: 'Dispensar',
    capped: 'Você chegou ao Grau máximo (6) — não há mais nada a comprar.',
    errors: {
      insufficient: 'XP insuficiente.',
      conflict: 'Este personagem foi alterado em outro lugar. Recarregue a página e tente de novo.',
      capped: 'Você já está no Grau máximo.',
      generic: 'Não foi possível aplicar o avanço. Tente novamente.',
    },
  },
  picks: {
    typeTitle: (tier) => `Grau ${tier} — escolha suas habilidades de Tipo`,
    focusTitle: (tier) => `Grau ${tier} — escolha uma habilidade de Foco`,
    skillTitle: (abilityName, tier) =>
      `${abilityName} (Grau ${tier}) — escolha as perícias que ela aprimora`,
    skillAlternateHint: (selected, required, alternate) =>
      `Escolha ${required}, ou ${alternate} para se especializar em uma perícia que já conhece — ${selected} selecionada(s)`,
    customPlaceholder: 'Ou digite a sua…',
    customAdd: 'Adicionar',
    hint: (selected, required) => `Escolha ${required} — ${selected} selecionada(s)`,
    confirm: 'Confirmar escolhas',
    error: 'Não foi possível salvar essas escolhas. Recarregue a página e tente de novo.',
  },
  skills: { skills: 'Perícias', abilities: 'Habilidades' },
  log: {
    xpLog: (total) => `Registro de XP · ${total} XP`,
    reasonPlaceholder: 'Descrição (ex.: intrusão do Mestre, marco da história)',
    gain: 'Ganhar',
    spend: 'Gastar',
    add: 'Adicionar',
    empty: 'Nenhum XP registrado nesta sessão ainda.',
    remove: 'Remover registro',
    notes: 'Anotações',
    notesPlaceholder: 'Notas da sessão, lembretes, pontas soltas…',
    saving: 'Salvando…',
    saved: 'Salvo',
    errors: {
      insufficient: 'XP insuficiente para gastar essa quantidade.',
      locked: 'Esse registro pagou um avanço e não pode ser removido.',
      wouldGoNegative: 'Removê-lo deixaria o XP abaixo de zero.',
      limit: 'O registro de XP está cheio.',
      generic: 'Não foi possível atualizar o registro de XP. Tente novamente.',
    },
  },
  inventory: {
    title: 'Cifras & Equipamentos',
    cypherCount: (count, limit) => `Cifras ${count} / ${limit}`,
    overLimit: (limit) =>
      `Você porta mais cifras que o seu limite de ${limit}. O Mestre pode permitir excedê-lo a algum custo.`,
    browseHint: 'Navegue pelo catálogo de cifras para adicionar uma ao inventário.',
    browse: 'Ver Cifras',
    search: 'Buscar cifras…',
    shown: (n) => `${n} exibidas`,
    close: 'Fechar',
    all: 'Todas',
    // Same labels apps/docs uses for the cypher categories.
    categories: {
      MANIFEST: 'Manifestação',
      FANTASTIC: 'Fantástico',
      SUBTLE: 'Sutil',
      POWER_BOOST: 'Impulso de Poder',
    },
    noResults: 'Nenhuma cifra encontrada.',
    level: (level) => `Nível: ${level}`,
    addToInventory: '+ Adicionar ao Inventário',
    loading: 'Carregando cifras…',
    loadFailed: 'Não foi possível carregar o catálogo de cifras.',
    itemName: 'Nome do item',
    itemMeta: 'Detalhe (ex.: Arma · 4 de dano)',
    add: 'Adicionar',
    decrease: 'Diminuir quantidade',
    increase: 'Aumentar quantidade',
    remove: 'Remover item',
    cypherMeta: (category, level) => `Cifra · ${category} · Nível ${level}`,
    itemDefaultMeta: 'Equipamento', // UNCONFIRMED
    errors: {
      limit: 'O inventário está cheio.',
      generic: 'Não foi possível atualizar o inventário. Tente novamente.',
    },
  },
  saveFailed:
    'Não foi possível salvar sua última alteração. Recarregue a página para ver o estado salvo.',
  syncing: 'Sincronizando…',
}

export const playCopy: Record<Locale, PlayCopy> = { en, 'pt-br': ptBr }

/** Condition from how many of the three Pools are at 0 (the damage track). */
export function conditionFor(emptyPools: number): ConditionKey {
  if (emptyPools <= 0) return 'hale'
  if (emptyPools === 1) return 'impaired'
  if (emptyPools === 2) return 'debilitated'
  return 'dead'
}
