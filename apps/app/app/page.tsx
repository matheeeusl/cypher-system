import { redirect } from 'next/navigation'

import { preferredLocale } from '@/lib/session'

// The real home page is localized: /en and /pt-br.
export default async function Root() {
  redirect(`/${await preferredLocale()}`)
}
