import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { LOCALE_HEADER } from '@/lib/i18n/auth'

// Route segments are case-sensitive and locales are keyed lowercase
// ('en', 'pt-br'), but people naturally type the BCP-47 casing, `pt-BR`.
// Redirect any other casing of the segment to the canonical one.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const match = /^\/pt-br(?=\/|$)/i.exec(pathname)

  if (match && match[0] !== '/pt-br') {
    const url = request.nextUrl.clone()
    url.pathname = '/pt-br' + pathname.slice(match[0].length)
    return NextResponse.redirect(url)
  }

  // Tell the root layout the page's language, so <html lang> is right in the
  // server's HTML (the layout is shared by every route and gets no params).
  // Always overwritten here, so a client can't supply its own value.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(LOCALE_HEADER, match ? 'pt-br' : 'en')
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  // Skip Next internals, API routes and files with an extension.
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
