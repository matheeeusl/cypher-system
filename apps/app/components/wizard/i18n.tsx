'use client'

import { createContext, useContext } from 'react'

import type { Locale } from '@/lib/i18n/auth'
import { loc } from '@/lib/i18n/localized'
import { terms, type Terms } from '@/lib/i18n/terms'
import { wizardCopy, type WizardCopy } from '@/lib/i18n/wizard'

interface WizardI18n {
  locale: Locale
  copy: WizardCopy
  terms: Terms
  /** Picks the current language from a `{ en, ptBR }` string. */
  t: (value: { en: string; ptBR: string }) => string
}

const WizardI18nContext = createContext<WizardI18n | null>(null)

export function WizardI18nProvider({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  const value: WizardI18n = {
    locale,
    copy: wizardCopy[locale],
    terms: terms[locale],
    t: (v) => loc(v, locale),
  }
  return <WizardI18nContext.Provider value={value}>{children}</WizardI18nContext.Provider>
}

export function useWizardI18n(): WizardI18n {
  const ctx = useContext(WizardI18nContext)
  if (!ctx) throw new Error('useWizardI18n must be used inside <WizardI18nProvider>')
  return ctx
}
