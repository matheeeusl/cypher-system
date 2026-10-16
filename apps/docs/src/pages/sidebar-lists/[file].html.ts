// Static files holding the long sidebar groups' entries — see
// src/lib/sidebar-lists.ts. Built as /sidebar-lists/<locale>-<list>.<hash>.html,
// one per list and locale; an HTML fragment (just the <li> rows), not a page.
import type { APIRoute, GetStaticPaths } from 'astro'

import { URL_LOCALES } from '@lib/locale'
import { SIDEBAR_LISTS, sidebarListFile, sidebarListHtml } from '@lib/sidebar-lists'

export const getStaticPaths = (() =>
  URL_LOCALES.flatMap((locale) =>
    SIDEBAR_LISTS.map((list) => ({
      params: { file: sidebarListFile(list, locale) },
      props: { html: sidebarListHtml(list, locale) },
    })),
  )) satisfies GetStaticPaths

export const GET: APIRoute = ({ props }) =>
  new Response((props as { html: string }).html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
