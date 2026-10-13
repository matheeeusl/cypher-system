'use client'

import { useEffect } from 'react'

import type { Locale } from '@/lib/i18n/auth'

/**
 * The root layout is shared by every route, so it can't know the page's
 * language. This keeps `<html lang>` in sync (screen readers, hyphenation,
 * browser translation prompts).
 */
export function HtmlLang({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale === 'pt-br' ? 'pt-BR' : 'en'
  }, [locale])
  return null
}
