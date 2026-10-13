import { headers } from 'next/headers'

import { auth } from '@/lib/auth'
import type { Locale } from '@/lib/i18n/auth'

export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

/** Best-effort locale for pages that aren't under /[locale] (e.g. the wizard at /). */
export async function preferredLocale(): Promise<Locale> {
  const accept = (await headers()).get('accept-language') ?? ''
  return accept.toLowerCase().startsWith('pt') ? 'pt-br' : 'en'
}
