import type { Metadata } from 'next'
import { Space_Grotesk, Inter, IBM_Plex_Mono } from 'next/font/google'
import { headers } from 'next/headers'

import { NextLinkProvider } from '@/components/NextLinkProvider'
import { LOCALE_HEADER } from '@/lib/i18n/auth'
import { metaCopy } from '@/lib/i18n/meta'

import './globals.css'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
})

const spaceGrotesk = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-mono',
  weight: ['400', '500'],
  subsets: ['latin'],
})

// Defaults; app/[locale]/layout.tsx localizes them, and pages set their own
// title through the template ("Log In · Cypher System").
export const metadata: Metadata = {
  metadataBase: new URL('https://play.csrd.app'),
  title: { default: metaCopy.en.siteTitle, template: '%s · Cypher System' },
  description: metaCopy.en.description,
  openGraph: { siteName: 'Cypher System', type: 'website' },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Shared by every route, so the page's locale comes from proxy.ts. Client-
  // side navigation between locales doesn't re-render this layout, which is
  // why HtmlLang still updates the attribute in the browser.
  const locale = (await headers()).get(LOCALE_HEADER) ?? 'en'
  return (
    <html
      lang={locale === 'pt-br' ? 'pt-BR' : 'en'}
      className={`${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable}`}
    >
      <body>
        <NextLinkProvider>{children}</NextLinkProvider>
      </body>
    </html>
  )
}
