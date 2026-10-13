import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

  return NextResponse.next()
}

export const config = {
  // Skip Next internals, API routes and files with an extension.
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
