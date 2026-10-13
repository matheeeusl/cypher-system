import type { StepId } from '@/components/wizard/state'
import type { ValidationIssueData } from '@/lib/graphql/queries'
import type { Locale } from '@/lib/i18n/auth'

// Game terms used by several screens live in lib/i18n/terms.ts. Terms marked
// UNCONFIRMED have no entry in the project glossary
// (.claude/skills/cypher-pt-br-translation/references/glossary.md) and are
// listed under "Needs confirmation" there.

type EntityKind = 'types' | 'descriptors' | 'foci' | 'skills' | 'abilities'
type SaveErrorReason = 'unauthorized' | 'invalid' | 'limit' | 'unavailable'
type ReviewRow =
  'type' | 'descriptor' | 'focus' | 'pools' | 'skills' | 'abilities' | 'equipment' | 'name'

export interface WizardCopy {
  steps: Record<StepId, { label: string; title: string; blurb?: string }>
  stepOf: (current: number, total: number) => string
  back: string
  next: string
  save: string
  saveChanges: string
  saving: string
  toList: string
  toSheet: string
  saveErrors: Record<SaveErrorReason, string>

  /** Plural display name of each entity list ("Types", "Foci"). */
  entities: Record<EntityKind, string>
  loading: (entities: string) => string
  loadFailed: (entities: string, error: string) => string
  chooseTypeFirst: string
  chooseDescriptorFirst: string

  sentence: {
    iAm: string
    who: string
    adjective: string
    noun: string
    verb: string
    /** "a Brash" / "an Appealing" / "um(a) Atrevido". */
    describe: (descriptorName: string) => string
  }

  search: {
    descriptors: (count: number) => string
    foci: (count: number) => string
    shown: (count: number) => string
    noResults: string
  }

  type: { startingEdge: string }
  descriptor: { tag: string; poolBonus: string; startingLink: string }
  focus: { tag: string; grants: (count: number) => string }
  pools: { remaining: string; breakdown: (base: number, added: number, total: number) => string }
  skills: {
    autoTrained: (descriptorName: string) => string
    selected: (count: number, needed: number) => string
    noExtraChoices: (descriptorName: string) => string
  }
  abilities: {
    selected: (count: number, needed: number) => string
    grantedByFocus: string
    focusChoice: (pick: number, count: number, needed: number) => string
  }
  equipment: {
    fixedByType: string
    none: string
    items: string
    cyphersNote: string
  }
  background: {
    nameLabel: string
    namePlaceholder: string
    backgroundLabel: string
    backgroundPlaceholder: string
  }
  review: { rows: Record<ReviewRow, string>; clothingOnly: string; edit: string }
  validation: {
    updating: string
    effort: string
    edge: (might: number, speed: number, intellect: number) => string
  }
  stepErrors: {
    selectType: string
    chooseEdge: string
    selectDescriptor: string
    selectFocus: string
    overspent: (by: number) => string
    allocateAll: string
    chooseSkills: (count: number) => string
    chooseAbilities: (count: number) => string
    focusChoices: string
    enterName: string
  }
  /** Localized text for an engine rule error, or null to fall back to the English message. */
  issue: (issue: ValidationIssueData) => string | null
}

function param(issue: ValidationIssueData, key: string): string {
  return issue.params.find((p) => p.key === key)?.value ?? ''
}

const en: WizardCopy = {
  steps: {
    type: {
      label: 'Type',
      title: 'Choose Your Type',
      blurb:
        'The noun of "I am an adjective noun who verbs." Your Type is the core of your character — in some other games, it might be called your character class.',
    },
    descriptor: {
      label: 'Descriptor',
      title: 'Choose Your Descriptor',
      blurb:
        'The adjective of "I am an adjective noun who verbs." Your Descriptor defines your character — it colors everything you do.',
    },
    focus: {
      label: 'Focus',
      title: 'Choose Your Focus',
      blurb:
        'The verb of "I am an adjective noun who verbs." Focus is what your character does best — it gives them specificity and interesting new abilities.',
    },
    pools: { label: 'Pools', title: 'Allocate Stat Pools' },
    skills: { label: 'Skills', title: 'Choose Trained Skills' },
    abilities: { label: 'Abilities', title: 'Choose Tier-1 Abilities' },
    equipment: { label: 'Equipment', title: 'Starting Equipment' },
    background: { label: 'Background', title: 'Name & Background' },
    review: { label: 'Review', title: 'Review Your Character' },
  },
  stepOf: (current, total) => `Step ${current} / ${total}`,
  back: '← Back',
  next: 'Next →',
  save: 'Save Character',
  saveChanges: 'Save Changes',
  saving: 'Saving…',
  toList: '← My Characters',
  toSheet: '← Character sheet',
  saveErrors: {
    unauthorized: 'Your session expired. Please log in again.',
    invalid: 'Some choices are incomplete or no longer valid. Review the steps and try again.',
    limit: 'You have reached the character limit for your plan.',
    unavailable: 'Could not save right now. Please try again.',
  },

  entities: {
    types: 'Types',
    descriptors: 'Descriptors',
    foci: 'Foci',
    skills: 'Skills',
    abilities: 'Abilities',
  },
  loading: (entities) => `Loading ${entities}…`,
  loadFailed: (entities, error) => `Couldn’t load ${entities}: ${error}`,
  chooseTypeFirst: 'Choose a Type first.',
  chooseDescriptorFirst: 'Choose a Descriptor first.',

  sentence: {
    iAm: 'I am',
    who: 'who',
    adjective: 'an adjective',
    noun: 'a noun',
    verb: 'a verb',
    describe: (name) => `${/^[aeiou]/i.test(name) ? 'an' : 'a'} ${name}`,
  },

  search: {
    descriptors: (count) => `Search ${count} descriptors…`,
    foci: (count) => `Search ${count} foci…`,
    shown: (count) => `${count} shown`,
    noResults: 'No results match your search.',
  },

  type: { startingEdge: 'Starting Edge — choose one' },
  descriptor: {
    tag: 'Descriptor',
    poolBonus: 'Pool bonus:',
    startingLink: 'Initial Link to the Starting Adventure',
  },
  focus: {
    tag: 'Focus',
    grants: (count) =>
      `Grants ${count} tier-1 ${count === 1 ? 'ability' : 'abilities'} — shown for you on the Abilities step.`,
  },
  pools: {
    remaining: 'Points remaining',
    breakdown: (base, added, total) => `${base} base + ${added} = ${total}`,
  },
  skills: {
    autoTrained: (name) => `Trained automatically by ${name}`,
    selected: (count, needed) => `${count} / ${needed} selected`,
    noExtraChoices: (name) =>
      `${name} doesn’t grant any additional skill choices beyond what’s listed above.`,
  },
  abilities: {
    selected: (count, needed) => `${count} / ${needed} selected`,
    grantedByFocus: 'Granted automatically by your Focus',
    focusChoice: (pick, count, needed) =>
      `Focus choice — pick ${pick} (${count} / ${needed} selected)`,
  },
  equipment: {
    fixedByType: 'Starting equipment is fixed by your Type — there’s nothing to choose here.',
    none: 'None',
    items: 'Items',
    cyphersNote:
      'Starting cyphers aren’t part of this build yet — the content model has no cypher-assignment field for character creation. That’s a data-model gap, not a UI one.',
  },
  background: {
    nameLabel: 'Character Name',
    namePlaceholder: 'e.g. Kessa Verne',
    backgroundLabel: 'Background',
    backgroundPlaceholder: 'A few sentences on who this character is…',
  },
  review: {
    rows: {
      type: 'TYPE',
      descriptor: 'DESCRIPTOR',
      focus: 'FOCUS',
      pools: 'POOLS',
      skills: 'SKILLS',
      abilities: 'ABILITIES',
      equipment: 'EQUIPMENT',
      name: 'CHARACTER NAME',
    },
    clothingOnly: 'Clothing only',
    edit: 'Edit',
  },
  validation: {
    updating: 'updating…',
    effort: 'Effort',
    edge: (might, speed, intellect) => `Edge M${might}/S${speed}/I${intellect}`,
  },
  stepErrors: {
    selectType: 'Select a Type to continue.',
    chooseEdge: 'Choose which stat gets your starting Edge.',
    selectDescriptor: 'Select a Descriptor to continue.',
    selectFocus: 'Select a Focus to continue.',
    overspent: (by) => `You've overspent your pool points by ${by}.`,
    allocateAll: 'Allocate all remaining points before continuing.',
    chooseSkills: (count) => `Choose exactly ${count} trained skill${count === 1 ? '' : 's'}.`,
    chooseAbilities: (count) => `Choose exactly ${count} tier-1 abilities.`,
    focusChoices: 'Make a selection for every Focus choice above.',
    enterName: 'Enter a character name to continue.',
  },
  issue: (issue) => {
    switch (issue.code) {
      case 'STARTING_EDGE_REQUIRED':
        return 'Choose which stat gets your starting Edge — this Type allows more than one.'
      case 'STARTING_EDGE_INVALID':
        return 'The chosen starting Edge stat is not valid for this Type.'
      case 'STARTING_EDGE_NOT_ALLOWED':
        return 'This Type has a single starting Edge stat — there is nothing to choose.'
      case 'FOCUS_SELECTION_MISSING':
        return `Your Focus offers a choice at tier ${param(issue, 'tier')}, but none was made.`
      case 'FOCUS_SELECTION_INVALID':
        return `The Focus selection for tier ${param(issue, 'tier')} is not one of the available options.`
      case 'FOCUS_BLOCKED_BY_TIER':
        return 'Focus abilities can’t be checked until the tier is resolved.'
      case 'POOL_ALLOCATION_NEGATIVE':
        return 'Pool points must be whole numbers, zero or more.'
      case 'POOL_ALLOCATION_SUM':
        return `Pool points must add up to exactly ${param(issue, 'expected')} (currently ${param(issue, 'actual')}).`
      case 'SKILL_CHOICE_COUNT':
        return `Choose exactly ${param(issue, 'required')} trained skills.`
      case 'SKILL_CHOICE_DUPLICATE':
        return 'The same skill was chosen more than once.'
      case 'SKILL_ALREADY_MAXED':
        return 'This skill is already Specialized — the maximum training level.'
      case 'ABILITY_TRAINING_UNKNOWN':
        return 'You can only train an ability the character already knows.'
      case 'ABILITY_TRAINING_BLOCKED':
        return 'Ability training can’t be checked until the known abilities are resolved.'
      case 'TIER_SUBSTITUTION_UNSUPPORTED':
        return `The advancement option "${param(issue, 'option')}" isn’t supported yet.`
      case 'TIER_DUPLICATE_OPTION':
        return `Tier ${param(issue, 'tier')} repeats the same advancement option.`
      case 'TIER_INCOMPLETE':
        return `Tier ${param(issue, 'tier')} needs the standard number of advancements.`
      case 'TIER_GAP':
        return `Tier ${param(issue, 'tier')} has no advancements, but a later tier does — tiers must be completed in order.`
      case 'TYPE_ABILITY_COUNT':
        return `Choose exactly ${param(issue, 'required')} tier-1 Type abilities.`
      case 'TYPE_ABILITY_DUPLICATE':
        return 'The same ability was chosen more than once.'
      case 'TYPE_ABILITY_UNAVAILABLE':
        return 'One of the chosen abilities isn’t available to this Type at tier 1.'
      default:
        return null
    }
  },
}

const ptBr: WizardCopy = {
  steps: {
    type: {
      label: 'Tipo',
      title: 'Escolha seu Tipo',
      blurb:
        'O substantivo de "Eu sou um(a) adjetivo substantivo que verbo." Seu Tipo é o núcleo do seu personagem — em outros jogos, ele poderia ser chamado de classe.',
    },
    descriptor: {
      label: 'Descritor',
      title: 'Escolha seu Descritor',
      blurb:
        'O adjetivo de "Eu sou um(a) adjetivo substantivo que verbo." Seu Descritor define seu personagem — ele colore tudo o que você faz.',
    },
    focus: {
      label: 'Foco',
      title: 'Escolha seu Foco',
      blurb:
        'O verbo de "Eu sou um(a) adjetivo substantivo que verbo." O Foco é aquilo que seu personagem faz de melhor — dá a ele especificidade e novas habilidades interessantes.',
    },
    pools: { label: 'Reservas', title: 'Distribua as Reservas' },
    skills: { label: 'Perícias', title: 'Escolha as Perícias Treinadas' },
    abilities: { label: 'Habilidades', title: 'Escolha as Habilidades de Grau 1' },
    equipment: { label: 'Equipamento', title: 'Equipamento Inicial' },
    background: { label: 'Antecedentes', title: 'Nome e Antecedentes' }, // UNCONFIRMED
    review: { label: 'Revisão', title: 'Revise seu Personagem' },
  },
  stepOf: (current, total) => `Etapa ${current} / ${total}`,
  back: '← Voltar',
  next: 'Próximo →',
  save: 'Salvar Personagem',
  saveChanges: 'Salvar Alterações',
  saving: 'Salvando…',
  toList: '← Meus Personagens',
  toSheet: '← Ficha do personagem',
  saveErrors: {
    unauthorized: 'Sua sessão expirou. Entre novamente.',
    invalid:
      'Algumas escolhas estão incompletas ou deixaram de ser válidas. Revise as etapas e tente novamente.',
    limit: 'Você atingiu o limite de personagens do seu plano.',
    unavailable: 'Não foi possível salvar agora. Tente novamente.',
  },

  entities: {
    types: 'Tipos',
    descriptors: 'Descritores',
    foci: 'Focos',
    skills: 'Perícias',
    abilities: 'Habilidades',
  },
  loading: (entities) => `Carregando ${entities}…`,
  loadFailed: (entities, error) => `Não foi possível carregar ${entities}: ${error}`,
  chooseTypeFirst: 'Escolha um Tipo primeiro.',
  chooseDescriptorFirst: 'Escolha um Descritor primeiro.',

  sentence: {
    iAm: 'Eu sou',
    who: 'que',
    adjective: 'um(a) adjetivo',
    noun: 'substantivo',
    verb: 'verbo',
    describe: (name) => `um(a) ${name}`,
  },

  search: {
    descriptors: (count) => `Buscar entre ${count} descritores…`,
    foci: (count) => `Buscar entre ${count} focos…`,
    shown: (count) => `${count} exibidos`,
    noResults: 'Nenhum resultado para a sua busca.',
  },

  type: { startingEdge: 'Margem inicial — escolha uma' },
  descriptor: {
    tag: 'Descritor',
    poolBonus: 'Bônus de Reserva:', // UNCONFIRMED
    startingLink: 'Vínculo inicial com a aventura inicial', // UNCONFIRMED
  },
  focus: {
    tag: 'Foco',
    grants: (count) =>
      `Concede ${count} ${count === 1 ? 'habilidade' : 'habilidades'} de Grau 1 — ${count === 1 ? 'exibida' : 'exibidas'} para você na etapa de Habilidades.`,
  },
  pools: {
    remaining: 'Pontos restantes',
    breakdown: (base, added, total) => `${base} base + ${added} = ${total}`,
  },
  skills: {
    autoTrained: (name) => `Treinadas automaticamente por ${name}`,
    selected: (count, needed) => `${count} / ${needed} selecionadas`,
    noExtraChoices: (name) =>
      `${name} não concede escolhas de perícia adicionais além das listadas acima.`,
  },
  abilities: {
    selected: (count, needed) => `${count} / ${needed} selecionadas`,
    grantedByFocus: 'Concedidas automaticamente pelo seu Foco',
    focusChoice: (pick, count, needed) =>
      `Escolha do Foco — escolha ${pick} (${count} / ${needed} selecionadas)`,
  },
  equipment: {
    fixedByType: 'O equipamento inicial é definido pelo seu Tipo — não há nada para escolher aqui.',
    none: 'Nenhum',
    items: 'Itens',
    cyphersNote:
      'As Cifras iniciais ainda não fazem parte desta versão — o modelo de conteúdo não tem um campo para atribuir cifras na criação de personagem. É uma lacuna no modelo de dados, não na interface.',
  },
  background: {
    nameLabel: 'Nome do Personagem',
    namePlaceholder: 'ex.: Kessa Verne',
    backgroundLabel: 'Antecedentes', // UNCONFIRMED
    backgroundPlaceholder: 'Algumas frases sobre quem é este personagem…',
  },
  review: {
    rows: {
      type: 'TIPO',
      descriptor: 'DESCRITOR',
      focus: 'FOCO',
      pools: 'RESERVAS',
      skills: 'PERÍCIAS',
      abilities: 'HABILIDADES',
      equipment: 'EQUIPAMENTO',
      name: 'NOME DO PERSONAGEM',
    },
    clothingOnly: 'Apenas vestuário', // UNCONFIRMED
    edit: 'Editar',
  },
  validation: {
    updating: 'atualizando…',
    effort: 'Esforço',
    edge: (might, speed, intellect) => `Margem F${might}/V${speed}/I${intellect}`,
  },
  stepErrors: {
    selectType: 'Selecione um Tipo para continuar.',
    chooseEdge: 'Escolha qual atributo recebe a Margem inicial.',
    selectDescriptor: 'Selecione um Descritor para continuar.',
    selectFocus: 'Selecione um Foco para continuar.',
    overspent: (by) => `Você gastou ${by} ${by === 1 ? 'ponto' : 'pontos'} de Reserva a mais.`,
    allocateAll: 'Distribua todos os pontos restantes antes de continuar.',
    chooseSkills: (count) =>
      `Escolha exatamente ${count} ${count === 1 ? 'perícia treinada' : 'perícias treinadas'}.`,
    chooseAbilities: (count) => `Escolha exatamente ${count} habilidades de Grau 1.`,
    focusChoices: 'Faça uma seleção para cada escolha do Foco acima.',
    enterName: 'Digite o nome do personagem para continuar.',
  },
  issue: (issue) => {
    switch (issue.code) {
      case 'STARTING_EDGE_REQUIRED':
        return 'Escolha qual atributo recebe a Margem inicial — este Tipo permite mais de um.'
      case 'STARTING_EDGE_INVALID':
        return 'O atributo escolhido para a Margem inicial não é válido para este Tipo.'
      case 'STARTING_EDGE_NOT_ALLOWED':
        return 'Este Tipo tem um único atributo para a Margem inicial — não há o que escolher.'
      case 'FOCUS_SELECTION_MISSING':
        return `Seu Foco oferece uma escolha no Grau ${param(issue, 'tier')}, mas nenhuma foi feita.`
      case 'FOCUS_SELECTION_INVALID':
        return `A seleção do Foco no Grau ${param(issue, 'tier')} não é uma das opções disponíveis.`
      case 'FOCUS_BLOCKED_BY_TIER':
        return 'As habilidades do Foco não podem ser verificadas até que o Grau seja definido.'
      case 'POOL_ALLOCATION_NEGATIVE':
        return 'Os pontos de Reserva devem ser números inteiros, zero ou mais.'
      case 'POOL_ALLOCATION_SUM':
        return `Os pontos de Reserva devem somar exatamente ${param(issue, 'expected')} (soma atual: ${param(issue, 'actual')}).`
      case 'SKILL_CHOICE_COUNT':
        return `Escolha exatamente ${param(issue, 'required')} perícias treinadas.`
      case 'SKILL_CHOICE_DUPLICATE':
        return 'A mesma perícia foi escolhida mais de uma vez.'
      case 'SKILL_ALREADY_MAXED':
        return 'Esta perícia já é Especializada — o nível máximo de treinamento.'
      case 'ABILITY_TRAINING_UNKNOWN':
        return 'Só é possível treinar uma habilidade que o personagem já conhece.'
      case 'ABILITY_TRAINING_BLOCKED':
        return 'O treinamento de habilidades não pode ser verificado até que as habilidades conhecidas sejam definidas.'
      case 'TIER_SUBSTITUTION_UNSUPPORTED':
        return `A opção de avanço "${param(issue, 'option')}" ainda não é suportada.`
      case 'TIER_DUPLICATE_OPTION':
        return `O Grau ${param(issue, 'tier')} repete a mesma opção de avanço.`
      case 'TIER_INCOMPLETE':
        return `O Grau ${param(issue, 'tier')} exige o número padrão de avanços.`
      case 'TIER_GAP':
        return `O Grau ${param(issue, 'tier')} não tem avanços, mas um Grau posterior tem — os Graus devem ser concluídos em ordem.`
      case 'TYPE_ABILITY_COUNT':
        return `Escolha exatamente ${param(issue, 'required')} habilidades de Grau 1 do Tipo.`
      case 'TYPE_ABILITY_DUPLICATE':
        return 'A mesma habilidade foi escolhida mais de uma vez.'
      case 'TYPE_ABILITY_UNAVAILABLE':
        return 'Uma das habilidades escolhidas não está disponível para este Tipo no Grau 1.'
      default:
        return null
    }
  },
}

export const wizardCopy: Record<Locale, WizardCopy> = { en, 'pt-br': ptBr }
