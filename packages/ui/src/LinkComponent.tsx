'use client'

import { createContext, useContext, type ComponentType, type ReactNode } from 'react'

/**
 * Anything that renders a link the way an `<a>` does — e.g. Next's `Link`.
 * Only the props this package's links actually pass, so a router link with
 * its own prop types still fits.
 */
export type LinkComponent = ComponentType<{
  href: string
  className?: string
  children?: ReactNode
}>

// This package can't import a framework's router link (the docs site uses it
// too), so its links render a plain <a> unless an app provides its own. An
// app's link does client-side navigation and prefetching, and lets the app
// show its loading screen at once instead of a full page reload.
const LinkContext = createContext<LinkComponent | 'a'>('a')

/**
 * Makes this package's links (CharacterCard, LinkButton) render with
 * `component`. It's a client component, so a Server Component layout has to
 * wrap it in one of its own that imports the link (a component can't be
 * passed as a prop across the server/client boundary).
 */
export function LinkProvider({
  component,
  children,
}: {
  component: LinkComponent
  children: ReactNode
}) {
  return <LinkContext.Provider value={component}>{children}</LinkContext.Provider>
}

export function useLinkComponent(): LinkComponent | 'a' {
  return useContext(LinkContext)
}
