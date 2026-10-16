'use client'

import Link from 'next/link'

import { LinkProvider } from '@cypher/ui'

// Gives @cypher/ui's links (character cards, LinkButton) Next's <Link>, so
// they navigate client-side with prefetching and show the route's
// loading.tsx right away, instead of a full page reload with nothing on
// screen until the server answers. Lives in its own client component because
// the root layout is a Server Component and can't hand `Link` across as a prop.
export function NextLinkProvider({ children }: { children: React.ReactNode }) {
  return <LinkProvider component={Link}>{children}</LinkProvider>
}
