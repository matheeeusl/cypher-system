import Link from 'next/link'

import { HtmlLang } from '@/components/HtmlLang'
import { ThemeToggle } from '@/components/wizard/ThemeToggle'
import type { Locale } from '@/lib/i18n/auth'

interface AppShellProps {
  locale: Locale
  /** Top-bar label, e.g. "CYPHER://ACCOUNT". */
  title: string
  /** Same page in the other language. */
  switchLocaleHref: string
  /** Extra controls rendered before the language switch (e.g. the user menu). */
  actions?: React.ReactNode
  children: React.ReactNode
}

/** Page chrome shared by the localized routes: top bar, language switch, theme toggle. */
export function AppShell({ locale, title, switchLocaleHref, actions, children }: AppShellProps) {
  const otherLocale = locale === 'en' ? 'pt-br' : 'en'

  return (
    <div className="bg-bg text-text min-h-screen">
      <HtmlLang locale={locale} />
      <header className="border-border bg-panel flex items-center justify-between gap-4 border-b px-7 py-3.5 print:hidden">
        <div className="flex items-center gap-2.5">
          <span className="bg-accent size-2 rounded-full shadow-[0_0_6px_var(--color-accent)]" />
          <span className="text-text-muted font-mono text-[13px] tracking-wider">{title}</span>
        </div>
        <div className="flex items-center gap-4">
          {actions}
          <div className="flex items-center gap-2">
            <Link
              href={switchLocaleHref}
              className="border-border bg-panel text-text-muted cursor-pointer rounded border px-4 py-2 font-mono text-[11px] transition-colors hover:opacity-90"
            >
              {otherLocale.toUpperCase()}
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="px-7 pt-8 pb-16">{children}</main>
    </div>
  )
}
