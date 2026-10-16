import type { MetadataRoute } from 'next'

// The app's one indexable page, in both languages (see app/[locale]/auth/page.tsx).
const languages = {
  en: 'https://play.csrd.app/en/auth',
  'pt-BR': 'https://play.csrd.app/pt-br/auth',
}

export default function sitemap(): MetadataRoute.Sitemap {
  return Object.values(languages).map((url) => ({
    url,
    changeFrequency: 'monthly',
    priority: 1,
    alternates: { languages },
  }))
}
