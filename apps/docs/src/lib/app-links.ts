import type { UrlLocale } from './locale'

// The character app (apps/app) lives on its own subdomain, so links into it
// are absolute. Its routes use the same locale segments as this site.
export const APP_URL = 'https://play.csrd.app'

export const appLinks = {
  newCharacter: (locale: UrlLocale) => `${APP_URL}/${locale}/characters/new`,
  signIn: (locale: UrlLocale) => `${APP_URL}/${locale}/auth`,
}
