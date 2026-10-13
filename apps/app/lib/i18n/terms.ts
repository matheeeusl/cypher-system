import type { PriceTier, SkillLevel, Stat } from '@/lib/graphql/queries'
import type { Locale } from '@/lib/i18n/auth'

/**
 * Game terms shown by more than one screen (the wizard and the character
 * sheet). One place, so a term can never get two different names.
 *
 * Terms marked UNCONFIRMED have no entry in the project glossary
 * (.claude/skills/cypher-pt-br-translation/references/glossary.md) — they are
 * listed under "Needs confirmation" there and should be reviewed.
 */
export interface Terms {
  stats: Record<Stat, string>
  skillLevels: Record<SkillLevel, string>
  priceTiers: Record<PriceTier, string>
  /** Same adjectives, agreeing with a plural noun ("itens baratos"). */
  priceTiersPlural: Record<PriceTier, string>
  /** "1 Might point" / "2 pontos de Força". */
  cost: (amount: number, stat: Stat) => string
  clothing: string
  clothingItem: string
  weapon: string
  gear: string
  /** "2 moderately priced items", "Up to 4 inexpensive items". */
  items: (count: number, exact: boolean, tier: PriceTier) => string
}

const en: Terms = {
  stats: { MIGHT: 'Might', SPEED: 'Speed', INTELLECT: 'Intellect' },
  skillLevels: {
    INABILITY: 'Inability',
    PRACTICED: 'Practiced',
    TRAINED: 'Trained',
    SPECIALIZED: 'Specialized',
  },
  priceTiers: {
    INEXPENSIVE: 'inexpensive',
    MODERATELY_PRICED: 'moderately priced',
    EXPENSIVE: 'expensive',
    VERY_EXPENSIVE: 'very expensive',
    EXORBITANT: 'exorbitant',
    PRICELESS: 'priceless',
  },
  priceTiersPlural: {
    INEXPENSIVE: 'inexpensive',
    MODERATELY_PRICED: 'moderately priced',
    EXPENSIVE: 'expensive',
    VERY_EXPENSIVE: 'very expensive',
    EXORBITANT: 'exorbitant',
    PRICELESS: 'priceless',
  },
  cost: (amount, stat) => `${amount} ${en.stats[stat]} point${amount === 1 ? '' : 's'}`,
  clothing: 'Clothing',
  clothingItem: 'A set of ordinary clothing',
  weapon: 'Weapon',
  gear: 'Gear',
  items: (count, exact, tier) => {
    const single = count === 1 && exact
    const price = (single ? en.priceTiers : en.priceTiersPlural)[tier]
    return `${exact ? count : `Up to ${count}`} ${price} item${single ? '' : 's'}`
  },
}

const ptBr: Terms = {
  stats: { MIGHT: 'Força', SPEED: 'Velocidade', INTELLECT: 'Intelecto' },
  skillLevels: {
    INABILITY: 'Inabilidade', // UNCONFIRMED
    PRACTICED: 'Praticado', // UNCONFIRMED
    TRAINED: 'Treinado',
    SPECIALIZED: 'Especializado',
  },
  // UNCONFIRMED — price tiers aren't in the glossary
  priceTiers: {
    INEXPENSIVE: 'barato',
    MODERATELY_PRICED: 'de preço moderado',
    EXPENSIVE: 'caro',
    VERY_EXPENSIVE: 'muito caro',
    EXORBITANT: 'exorbitante',
    PRICELESS: 'inestimável',
  },
  priceTiersPlural: {
    INEXPENSIVE: 'baratos',
    MODERATELY_PRICED: 'de preço moderado',
    EXPENSIVE: 'caros',
    VERY_EXPENSIVE: 'muito caros',
    EXORBITANT: 'exorbitantes',
    PRICELESS: 'inestimáveis',
  },
  cost: (amount, stat) => `${amount} ponto${amount === 1 ? '' : 's'} de ${ptBr.stats[stat]}`,
  clothing: 'Vestuário', // UNCONFIRMED
  clothingItem: 'Um conjunto de roupas comuns',
  weapon: 'Arma',
  gear: 'Equipamento',
  items: (count, exact, tier) => {
    const single = count === 1 && exact
    const price = (single ? ptBr.priceTiers : ptBr.priceTiersPlural)[tier]
    return `${exact ? count : `Até ${count}`} ite${single ? 'm' : 'ns'} ${price}`
  },
}

export const terms: Record<Locale, Terms> = { en, 'pt-br': ptBr }
