import type { MetadataRoute } from 'next'

// Only the auth API is off limits. The character pages are left crawlable on
// purpose: they carry `noindex` (app/[locale]/layout.tsx), and a crawler
// blocked here would never read it — the URL could still be listed, just
// without content. Without a session they redirect to sign-in anyway.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: 'https://play.csrd.app/sitemap.xml',
  }
}
