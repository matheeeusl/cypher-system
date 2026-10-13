import Link from 'next/link'

import { BRAND_PREFIX } from '@cypher/ui'

import type { Locale } from '@/lib/i18n/auth'

interface AppBrandProps {
  locale: Locale
  /** What follows the brand prefix (which links back to My Characters), e.g. "ACCOUNT" → "CYPHER://ACCOUNT". */
  section: string
}

export function AppBrand({ locale, section }: AppBrandProps) {
  return (
    <span className="text-text-muted font-mono text-[13px] tracking-wider">
      <Link href={`/${locale}`} className="hover:text-accent transition-colors">
        {BRAND_PREFIX}
      </Link>
      {section}
    </span>
  )
}
