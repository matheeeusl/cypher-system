import type { Locale } from '@/lib/i18n/auth'
import { terms } from '@/lib/i18n/terms'

// Game terms: lib/i18n/terms.ts for ones shared with the wizard/sheet. Damage
// track names and effects follow apps/docs' recovery-and-healing chapter (the
// rules source of truth), with the glossary's pt-br spellings. Terms marked
// UNCONFIRMED have no glossary entry — see "Needs confirmation" there.

export type CypherCategoryKey = 'MANIFEST' | 'FANTASTIC' | 'SUBTLE' | 'POWER_BOOST'
export type ConditionKey = 'hale' | 'impaired' | 'debilitated' | 'dead'
export type AdvancementKey =
  | 'pools'
  | 'edge'
  | 'effort'
  | 'skills'
  // The Other Options: at most one per tier, in place of a standard one.
  | 'armor'
  | 'recovery'
  | 'typeAbility'
  | 'focusAbility'

export interface PlayCopy {
  title: string
  backToSheet: string
  tabs: { status: string; skills: string; inventory: string; log: string; notes: string }
  chips: { tier: (n: number) => string; effort: (n: number) => string }
  pools: {
    title: string
    effort: string
    edge: string
    spend: string
    recover: string
    recoverFull: string
    amount: string
    /** "1d6 + N": the recovery roll with the tier and the Other Option bonus. */
    recoveryRoll: (bonus: number) => string
    /** Shown only once an Other Option reduced it. */
    armorReduction: (n: number) => string
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
    /** Starts the XP-log line of a refunded advancement. */
    refundPrefix: string
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
    /** Switches the Skills advancement from the skill list to the ability list, and back. */
    toAbilities: string
    toSkills: string
    abilitySearch: string
    abilityOption: (name: string) => string
    abilityTrained: (name: string) => string
    /** The fifth row: one Other Option a tier, in place of a standard step. */
    other: string
    otherTitle: string
    otherOption: string
    otherTypeAbilitySearch: string
    /** A Type (or flavor) ability the Other Option can take: its tier, and the flavor when it is one. */
    otherTypeAbilityOption: (name: string, tier: number, flavor: string | null) => string
    otherFocusTitle: string
    /** The GM decides whether a second Focus choice is allowed. */
    otherFocusWarning: string
    otherNothing: string
    back: string
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
    optionTitle: (abilityName: string, tier: number) => string
    /** Improved Edge gained at `tier`: the Edge at 0 it raises. */
    edgeTitle: (abilityName: string, tier: number) => string
    /** Hint for an ability that takes two pick counts ("two skills, or one specialized"). */
    skillAlternateHint: (selected: number, required: number, alternate: number) => string
    customPlaceholder: string
    customAdd: string
    hint: (selected: number, required: number) => string
    confirm: string
    error: string
  }
  /** Gaining a flavor in play. */
  flavorGain: {
    /** The XP-log line of the purchase. */
    reason: (flavorName: string) => string
    title: string
    gainedTitle: (flavorName: string) => string
    description: (xp: number) => string
    disclaimer: string
    open: string
    choose: string
    exchanges: string
    exchangesHint: string
    giveUp: string
    take: string
    pickOne: string
    tier: (tier: number) => string
    addExchange: string
    removeExchange: string
    /** Checkbox: the GM granted the flavor (a character arc), so it costs no XP. */
    free: string
    confirm: (xp: number, free: boolean) => string
    needs: (xp: number) => string
    swap: (replaces: string, taken: string, tier: number) => string
    noExchanges: string
    undo: (paidXp: number) => string
    /** Note under the flavor selector that no exchange is available. */
    nothingToExchange: string
    errors: { insufficient: string; conflict: string; notRevertable: string; generic: string }
  }
  /** Buying more options of a choice ability for XP (Cantrips). */
  learn: {
    title: (abilityName: string) => string
    description: (xp: number, count: number) => string
    action: (xp: number) => string
    needs: (xp: number) => string
    none: string
    learned: string
    undo: string
    /** The XP-log line of a purchase. */
    reason: (names: string[]) => string
    errors: { insufficient: string; conflict: string; generic: string }
  }
  skills: { skills: string; abilities: string; abilityTrained: string; createdByYou: string }
  log: {
    xpLog: (total: number) => string
    reasonPlaceholder: string
    gain: string
    spend: string
    add: string
    empty: string
    remove: string
    previous: string
    next: string
    page: (current: number, total: number) => string
    notes: string
    notesPlaceholder: string
    notesAdd: string
    notesEmpty: string
    notesEdit: string
    notesSave: string
    notesCancel: string
    notesRemove: string
    notesCount: (used: number, max: number) => string
    notesErrors: { limit: string; generic: string }
    history: {
      title: string
      empty: string
      hint: string
      tier: (tier: number) => string
      undo: string
      lockedHint: string
      confirmTitle: string
      confirmDescription: (label: string, xp: number) => string
      confirm: string
      cancel: string
      working: string
      errors: { notRevertable: string; conflict: string; generic: string }
    }
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
    /** Shown when an item the player typed in is opened. */
    customItem: string
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
    previous: string
    next: string
    page: (current: number, total: number) => string
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
    log: 'XP Log',
    notes: 'Notes',
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
    recoveryRoll: (bonus) => `Recovery roll 1d6 + ${bonus}`,
    armorReduction: (n) => `Armor Speed Effort cost −${n}`,
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
      armor: 'Armor — −1 Speed Effort cost for wearing armor',
      recovery: 'Recovery — +2 to recovery rolls',
      typeAbility: 'Type ability — another special ability from your Type',
      focusAbility: 'Focus choice — a second ability choice from your Focus',
    },
    purchased: 'Purchased',
    refundPrefix: 'Refund',
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
    toAbilities: 'Train a special ability instead →',
    toSkills: '← Back to skills',
    abilitySearch: 'Search your special abilities',
    abilityOption: (name) => `${name} — ability (train)`,
    abilityTrained: (name) => `${name} — ability, already trained`,
    other: 'Other option — in place of one step, once per tier',
    otherTitle: 'Choose an Other option:',
    otherOption: 'Choose…',
    otherTypeAbilitySearch: 'Search your Type’s abilities',
    otherTypeAbilityOption: (name, tier, flavor) =>
      `${name} — tier ${tier}${flavor ? ` · ${flavor}` : ''}`,
    otherFocusTitle: 'Take another option of a Focus choice:',
    otherFocusWarning: 'A second Focus choice is up to your GM — talk to them before buying it.',
    otherNothing: 'Nothing left to take.',
    back: '← Back',
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
    optionTitle: (abilityName, tier) => `${abilityName} (tier ${tier}) — choose its abilities`,
    edgeTitle: (abilityName, tier) =>
      `${abilityName} (tier ${tier}) — choose an Edge at 0 to raise to 1`,
    skillAlternateHint: (selected, required, alternate) =>
      `Choose ${required}, or ${alternate} to specialize in a skill you already know — ${selected} selected`,
    customPlaceholder: 'Or type your own…',
    customAdd: 'Add',
    hint: (selected, required) => `Choose ${required} — ${selected} selected`,
    confirm: 'Confirm choices',
    error: 'Could not save these choices. Reload the page and try again.',
  },
  flavorGain: {
    reason: (flavorName) => `Gained the ${flavorName} flavor`,
    title: 'Gain a flavor',
    gainedTitle: (flavorName) => `Flavor gained in play: ${flavorName}`,
    description: (xp) =>
      `A flavor lets you exchange Type abilities you picked for abilities from its list. It costs ${xp} XP, or nothing if a character arc earned it.`,
    disclaimer:
      'Talk to your GM first: they decide whether it fits the game and how many exchanges to allow (more, if you gain it after tier 2). An exchange is permanent.',
    open: 'Gain a flavor…',
    choose: 'Choose a flavor',
    exchanges: 'Exchanges',
    exchangesHint:
      'Give up a Type ability you picked for one from the flavor, of the same tier or lower. You can also add none.',
    giveUp: 'Give up',
    take: 'Take instead',
    pickOne: 'Choose…',
    tier: (tier) => `Tier ${tier}`,
    addExchange: 'Add an exchange',
    removeExchange: 'Remove',
    free: 'My GM granted it (character arc) — no XP',
    confirm: (xp, free) => (free ? 'Gain flavor (granted)' : `Gain flavor (${xp} XP)`),
    needs: (xp) => `Needs ${xp} XP`,
    swap: (replaces, taken, tier) => `${replaces} → ${taken} (tier ${tier})`,
    noExchanges: 'No exchanges: the flavor only adds to your future choices.',
    undo: (paidXp) => (paidXp > 0 ? `Undo (refunds ${paidXp} XP)` : 'Undo'),
    nothingToExchange: 'None of your Type abilities can be exchanged right now.',
    errors: {
      insufficient: 'Not enough XP.',
      conflict: 'The character changed in another tab. Reload and try again.',
      notRevertable: 'This can’t be undone now: later choices depend on the flavor.',
      generic: 'Could not save this. Try again.',
    },
  },
  learn: {
    title: (abilityName) => `Learn more — ${abilityName}`,
    description: (xp, count) =>
      `Spend ${xp} XP to learn ${count} more. Talk to your GM first about how your character learned them.`,
    action: (xp) => `Learn (${xp} XP)`,
    needs: (xp) => `Needs ${xp} XP`,
    none: 'There is nothing left to learn.',
    learned: 'Learned',
    undo: 'Undo (refunds the XP)',
    reason: (names) => `Learned: ${names.join(', ')}`,
    errors: {
      insufficient: 'Not enough XP.',
      conflict: 'The character changed in another tab. Reload and try again.',
      generic: 'Could not save this. Try again.',
    },
  },
  skills: {
    skills: 'Skills',
    abilities: 'Abilities',
    abilityTrained: 'Trained',
    createdByYou: 'Created by you — a skill you added yourself.',
  },
  log: {
    xpLog: (total) => `XP Log · ${total} XP`,
    reasonPlaceholder: 'Description (e.g. GM intrusion, milestone)',
    gain: 'Gain',
    spend: 'Spend',
    add: 'Add',
    empty: 'No XP recorded yet this session.',
    remove: 'Remove entry',
    previous: '← Newer',
    next: 'Older →',
    page: (current, total) => `Page ${current} of ${total}`,
    notes: 'Notes',
    notesPlaceholder: 'A note: a clue, a name, a loose thread…',
    notesAdd: 'Add note',
    notesEmpty: 'No notes yet.',
    notesEdit: 'Edit note',
    notesSave: 'Save',
    notesCancel: 'Cancel',
    notesRemove: 'Remove note',
    notesCount: (used, max) => `${used} / ${max}`,
    notesErrors: {
      limit: 'This character has reached the note limit. Remove one to add another.',
      generic: 'Could not save the note. Try again.',
    },
    history: {
      title: 'Advancement history',
      empty: 'No advancements purchased yet.',
      hint: 'Undo the newest tier’s advancements first; an advancement’s XP is refunded to the log.',
      tier: (tier) => `Tier ${tier}`,
      undo: 'Undo',
      lockedHint: 'Undo the later tier’s advancements first.',
      confirmTitle: 'Undo this advancement?',
      confirmDescription: (label, xp) =>
        `${label}\n\nIt is removed from the character and ${xp} XP is refunded to the log. If it was the last step of a tier, the character goes back to the previous tier and the choices made for the new tier (abilities, skills) are removed.`,
      confirm: 'Undo advancement',
      cancel: 'Cancel',
      working: 'Undoing…',
      errors: {
        notRevertable: 'This advancement can’t be undone now: later choices depend on it.',
        conflict: 'The character changed in another tab. Reload and try again.',
        generic: 'Could not undo the advancement. Try again.',
      },
    },
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
    customItem: 'An item you added yourself.',
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
    previous: '← Previous',
    next: 'Next →',
    page: (current, total) => `Page ${current} of ${total}`,
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
    log: 'Registro de XP',
    notes: 'Notas',
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
    recoveryRoll: (bonus) => `Rolagem de recuperação 1d6 + ${bonus}`,
    armorReduction: (n) => `Custo de Esforço de Velocidade da armadura −${n}`,
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
      armor: 'Armadura — −1 no custo de Esforço de Velocidade para usar armadura',
      recovery: 'Recuperação — +2 nas rolagens de recuperação',
      typeAbility: 'Habilidade de Tipo — outra habilidade especial do seu Tipo',
      focusAbility: 'Escolha de Foco — uma segunda escolha de habilidade do seu Foco',
    },
    purchased: 'Comprado',
    refundPrefix: 'Reembolso',
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
    toAbilities: 'Treinar uma habilidade especial →',
    toSkills: '← Voltar às perícias',
    abilitySearch: 'Buscar suas habilidades especiais',
    abilityOption: (name) => `${name} — habilidade (treinar)`,
    abilityTrained: (name) => `${name} — habilidade, já treinada`,
    other: 'Outra opção — no lugar de uma etapa, uma vez por Grau',
    otherTitle: 'Escolha uma das Outras Opções:',
    otherOption: 'Escolher…',
    otherTypeAbilitySearch: 'Buscar habilidades do seu Tipo',
    otherTypeAbilityOption: (name, tier, flavor) =>
      `${name} — Grau ${tier}${flavor ? ` · ${flavor}` : ''}`,
    otherFocusTitle: 'Pegue outra opção de uma escolha do Foco:',
    otherFocusWarning:
      'Uma segunda escolha do Foco depende do Mestre — converse com ele antes de comprar.',
    otherNothing: 'Nada disponível.',
    back: '← Voltar',
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
    optionTitle: (abilityName, tier) =>
      `${abilityName} (Grau ${tier}) — escolha as habilidades dela`,
    edgeTitle: (abilityName, tier) =>
      `${abilityName} (Grau ${tier}) — escolha uma Margem em 0 para subir para 1`,
    skillAlternateHint: (selected, required, alternate) =>
      `Escolha ${required}, ou ${alternate} para se especializar em uma perícia que já conhece — ${selected} selecionada(s)`,
    customPlaceholder: 'Ou digite a sua…',
    customAdd: 'Adicionar',
    hint: (selected, required) => `Escolha ${required} — ${selected} selecionada(s)`,
    confirm: 'Confirmar escolhas',
    error: 'Não foi possível salvar essas escolhas. Recarregue a página e tente de novo.',
  },
  flavorGain: {
    reason: (flavorName) => `Ganhou o ${terms['pt-br'].flavor} ${flavorName}`,
    title: `Ganhar um ${terms['pt-br'].flavor}`,
    gainedTitle: (flavorName) => `${terms['pt-br'].flavor} ganho em jogo: ${flavorName}`,
    description: (xp) =>
      `Um ${terms['pt-br'].flavor} permite trocar habilidades de Tipo que você escolheu por habilidades da lista dele. Custa ${xp} XP, ou nada se um arco do personagem o concedeu.`,
    disclaimer:
      'Converse antes com o Mestre: ele decide se combina com o jogo e quantas trocas permitir (mais, se você o ganhar depois do Grau 2). Uma troca é permanente.',
    open: `Ganhar um ${terms['pt-br'].flavor}…`,
    choose: `Escolha um ${terms['pt-br'].flavor}`,
    exchanges: 'Trocas',
    exchangesHint: `Abra mão de uma habilidade de Tipo que você escolheu por uma do ${terms['pt-br'].flavor}, do mesmo Grau ou menor. Você também pode não trocar nenhuma.`,
    giveUp: 'Abrir mão de',
    take: 'Ficar com',
    pickOne: 'Escolha…',
    tier: (tier) => `Grau ${tier}`,
    addExchange: 'Adicionar uma troca',
    removeExchange: 'Remover',
    free: 'O Mestre concedeu (arco do personagem) — sem XP',
    confirm: (xp, free) => (free ? 'Ganhar (concedido)' : `Ganhar (${xp} XP)`),
    needs: (xp) => `Requer ${xp} XP`,
    swap: (replaces, taken, tier) => `${replaces} → ${taken} (Grau ${tier})`,
    noExchanges: 'Sem trocas: só passa a somar às suas escolhas futuras.',
    undo: (paidXp) => (paidXp > 0 ? `Desfazer (devolve ${paidXp} XP)` : 'Desfazer'),
    nothingToExchange: 'Nenhuma das suas habilidades de Tipo pode ser trocada agora.',
    errors: {
      insufficient: 'XP insuficiente.',
      conflict: 'O personagem mudou em outra aba. Recarregue e tente de novo.',
      notRevertable: 'Não dá para desfazer agora: escolhas posteriores dependem dele.',
      generic: 'Não foi possível salvar. Tente de novo.',
    },
  },
  learn: {
    title: (abilityName) => `Aprender mais — ${abilityName}`,
    description: (xp, count) =>
      `Gaste ${xp} XP para aprender mais ${count}. Combine antes com o Mestre como o personagem os aprendeu.`,
    action: (xp) => `Aprender (${xp} XP)`,
    needs: (xp) => `Requer ${xp} XP`,
    none: 'Não há mais nada para aprender.',
    learned: 'Aprendidos',
    undo: 'Desfazer (devolve o XP)',
    reason: (names) => `Aprendeu: ${names.join(', ')}`,
    errors: {
      insufficient: 'XP insuficiente.',
      conflict: 'O personagem mudou em outra aba. Recarregue e tente de novo.',
      generic: 'Não foi possível salvar. Tente de novo.',
    },
  },
  skills: {
    skills: 'Perícias',
    abilities: 'Habilidades',
    abilityTrained: 'Treinada',
    createdByYou: 'Criada por você — uma perícia que você mesmo adicionou.',
  },
  log: {
    xpLog: (total) => `Registro de XP · ${total} XP`,
    reasonPlaceholder: 'Descrição (ex.: intrusão do Mestre, marco da história)',
    gain: 'Ganhar',
    spend: 'Gastar',
    add: 'Adicionar',
    empty: 'Nenhum XP registrado nesta sessão ainda.',
    remove: 'Remover registro',
    previous: '← Mais recentes',
    next: 'Mais antigos →',
    page: (current, total) => `Página ${current} de ${total}`,
    notes: 'Anotações',
    notesPlaceholder: 'Uma nota: uma pista, um nome, uma ponta solta…',
    notesAdd: 'Adicionar nota',
    notesEmpty: 'Nenhuma nota ainda.',
    notesEdit: 'Editar nota',
    notesSave: 'Salvar',
    notesCancel: 'Cancelar',
    notesRemove: 'Remover nota',
    notesCount: (used, max) => `${used} / ${max}`,
    notesErrors: {
      limit: 'Este personagem atingiu o limite de notas. Remova uma para adicionar outra.',
      generic: 'Não foi possível salvar a nota. Tente novamente.',
    },
    history: {
      title: 'Histórico de avanços',
      empty: 'Nenhum avanço comprado ainda.',
      hint: 'Desfaça primeiro os avanços do Grau mais recente; o XP do avanço volta para o registro.',
      tier: (tier) => `Grau ${tier}`,
      undo: 'Desfazer',
      lockedHint: 'Desfaça antes os avanços do Grau mais recente.',
      confirmTitle: 'Desfazer este avanço?',
      confirmDescription: (label, xp) =>
        `${label}\n\nEle é removido do personagem e ${xp} XP voltam para o registro. Se era o último passo de um Grau, o personagem volta ao Grau anterior e as escolhas feitas para o novo Grau (habilidades, perícias) são removidas.`,
      confirm: 'Desfazer avanço',
      cancel: 'Cancelar',
      working: 'Desfazendo…',
      errors: {
        notRevertable:
          'Este avanço não pode ser desfeito agora: escolhas posteriores dependem dele.',
        conflict: 'O personagem mudou em outra aba. Recarregue e tente de novo.',
        generic: 'Não foi possível desfazer o avanço. Tente de novo.',
      },
    },
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
    customItem: 'Um item que você mesmo adicionou.',
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
    previous: '← Anterior',
    next: 'Próxima →',
    page: (current, total) => `Página ${current} de ${total}`,
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
