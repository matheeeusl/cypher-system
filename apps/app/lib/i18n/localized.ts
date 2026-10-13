import type { LocalizedString } from '@/lib/graphql/queries'
import type { Locale } from '@/lib/i18n/auth'

/** Picks the right side of a `{ en, ptBR }` string coming from graphql-api. */
export function loc(value: LocalizedString, locale: Locale): string {
  return locale === 'pt-br' ? value.ptBR : value.en
}
