import type { Metadata } from 'next'
import { Space_Grotesk, Inter, IBM_Plex_Mono } from 'next/font/google'
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

export const metadata: Metadata = {
  title: 'Cypher System',
  description: 'Character management for the Cypher System TTRPG',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
