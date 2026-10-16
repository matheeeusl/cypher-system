'use client'

import { useParams, usePathname } from 'next/navigation'

import { AppShell } from '@/components/AppShell'
import { isLocale, type Locale } from '@/lib/i18n/auth'
import { playCopy } from '@/lib/i18n/play'

/**
 * Shown by the character routes' loading.tsx while the server builds the
 * page, so a click answers at once instead of leaving the previous page on
 * screen. A client component because loading.tsx gets no `params`, and the
 * shell needs the locale. Same shell as the real page, minus the user menu
 * (that needs the session). `page` picks the top-bar label (a string, not a
 * function: props from loading.tsx, a Server Component, must be serializable).
 */
export function CharacterPageSkeleton({ page }: { page: 'sheet' | 'play' }) {
  const params = useParams<{ locale: string }>()
  const pathname = usePathname()
  const locale: Locale = isLocale(params.locale) ? params.locale : 'en'
  const other = locale === 'en' ? 'pt-br' : 'en'

  return (
    <AppShell
      locale={locale}
      section={page === 'play' ? playCopy[locale].title : 'CHARACTER'}
      switchLocaleHref={pathname.replace(/^\/[^/]+/, `/${other}`)}
    >
      <div
        className="mx-auto flex w-full max-w-200 animate-pulse flex-col gap-4"
        role="status"
        aria-label={locale === 'pt-br' ? 'Carregando…' : 'Loading…'}
      >
        <div className="bg-panel h-3 w-28 rounded" />
        <div className="border-border bg-panel h-28 rounded-md border" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="border-border bg-panel h-24 rounded-md border" />
          <div className="border-border bg-panel h-24 rounded-md border" />
          <div className="border-border bg-panel h-24 rounded-md border" />
        </div>
        <div className="border-border bg-panel h-64 rounded-md border" />
      </div>
    </AppShell>
  )
}
