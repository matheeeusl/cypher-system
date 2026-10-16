'use client'

import { useEffect } from 'react'

import type { Locale } from '@/lib/i18n/auth'

/**
 * The root layout sets `<html lang>` on the server (from proxy.ts's locale
 * header), but it isn't re-rendered on client-side navigation — switching
 * language through a <Link> keeps the old value. This keeps it in sync
 * (screen readers, hyphenation, browser translation prompts).
 */
export function HtmlLang({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale === 'pt-br' ? 'pt-BR' : 'en'
  }, [locale])
  return null
}
