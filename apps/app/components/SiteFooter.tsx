import { COPYRIGHT_HOLDER, FOOTER_LABELS, KOFI_URL, type FooterLocale } from '@cypher/ui/footer'

import { SupportMenu } from '@/components/SupportMenu'

/**
 * Copyright + "buy me a coffee" footer, the same one the docs site shows (the text and
 * links come from `@cypher/ui/footer`). en links straight to Ko-fi; pt-br adds Pix.
 */
export function SiteFooter({
  locale,
  className = '',
}: {
  locale: FooterLocale
  className?: string
}) {
  const labels = FOOTER_LABELS[locale]

  return (
    <footer
      className={`border-border text-text-muted flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t px-4 py-3 font-mono text-[11px] sm:px-7 print:hidden ${className}`}
    >
      <span>
        © {new Date().getFullYear()} {COPYRIGHT_HOLDER}. {labels.rights}
      </span>
      {labels.pix ? (
        <SupportMenu labels={labels.pix} />
      ) : (
        <a
          href={KOFI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent! hover:underline!"
        >
          ☕ {labels.kofi}
        </a>
      )}
    </footer>
  )
}
