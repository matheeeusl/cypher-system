# Plano: performance do app + SEO (docs e app)

Levantado e executado em 2026-10-16. Pausado nesse dia, a pedido do Matheus, para fazer deploy e usar o site antes de continuar.

## Estado atual (2026-10-16)

- **Feito:** todos os itens de prioridade alta e média — performance (Fases 1, 3 e 4), SEO dos docs, SEO do app, acessibilidade dos docs.
- **Resultado sentido em produção:** app "bem mais rápido" ao abrir personagem e "Jogar" (relato do Matheus após o deploy da região); Lighthouse dos docs em produção melhorou (o mobile estava em 77).
- **Commits desta rodada** (do mais antigo ao mais novo): `1d4e284` teste do wizard · `50098e9` cache dos catálogos · `2edc2ca` robots/redirect/home meta · `4bedd04` fontes self-hosted · `7313595` sidebar em arquivos cacheados · `559ee4f` menos idas ao banco · `12af975` loading.tsx + `<Link>` · `94daa76` região `gru1` · `1ebc4d3` SEO do app · `051da58` acessibilidade · `c2583dd` título pt-BR + JSON-LD · `0fa60d3` imagens de compartilhamento.
- **Pendente de push:** `1ebc4d3`, `051da58`, `c2583dd`, `0fa60d3` e o commit deste arquivo.

### Ao retomar

1. Depois do deploy, conferir o que não deu para testar daqui (o ambiente do Claude não resolve `csrd.app`):
   - `curl -I -H "Accept-Language: pt-BR" https://csrd.app/` → `307` para `/pt-br/` (sem `-s`: se der "Could not resolve host", é o DNS do WSL, não o site — confirmar no navegador).
   - Aba Network: `/sidebar-lists/...` vem com `cache-control: public, max-age=31536000, immutable`.
   - Ctrl+F dentro de grupo fechado da sidebar no Firefox e no Safari.
   - Prévia de link (WhatsApp/Discord) mostra a imagem; Facebook Sharing Debugger para forçar atualização.
2. **Manual (Matheus):** cadastrar `csrd.app` e `play.csrd.app` no Google Search Console (e Bing) e enviar os sitemaps (`/sitemap-index.xml` nos docs, `/sitemap.xml` no app).
3. Se algo ainda parecer lento, **medir antes de mexer** (Fase 0) e seguir pelos itens restantes abaixo, começando pelo cache do `validateCharacterChoices`.

## Diagnóstico inicial (produção, 2026-10-16)

- Cada página do app re-buscava **todo o catálogo de regras** na `api.csrd.app` a cada request, sem cache:
  - Ficha (`app/[locale]/characters/[id]/page.tsx`): session → getCharacter → getPlayData (DB, em série) → `loadDerived` (6 queries GraphQL) → `validateCharacterChoices` (+1 ida) + `fetchContentVersions`.
  - Query `abilities` = **326 KB**, 0,8–1,2 s; cada ida à API custava ~220–400 ms mesmo mínima.
  - `lib/graphql/client.ts` usava `POST` → nada era cacheado (`cache-control: private, no-store`, `x-vercel-cache: MISS`).
  - Funções em **iad1 (EUA)** com usuário e banco no Brasil (`x-vercel-id: gru1::iad1`).
  - Wizard baixava os mesmos catálogos no navegador; server actions do play também.
  - `setPoolMax` (escrita no DB) rodava durante o render do play; navegação usava `<a href>` (sem prefetch).
- O conteúdo só muda em deploy (YAML em `@cypher/content`) → re-buscar a cada request era desperdício.

## Performance (app)

- [ ] **Fase 0 — Medir**: não feita formalmente (o ganho foi evidente). Para a próxima rodada: Vercel Speed Insights; `Server-Timing`/`console.time` em `loadDerived`; TTFB de lista, ficha e play.
- [x] **Fase 1 — Cache dos catálogos**
  - [x] 1a. `cachedCatalog` em `apps/app/lib/graphql/cache.ts`: Promise em memória, TTL 10 min, requisições simultâneas compartilham uma busca, falha não fica em cache.
  - [x] 1b. Catálogos via `GET` (`gqlRequest(..., { method: 'GET' })`, também evita o preflight CORS no navegador); a API marca GET com `Cache-Control: public, max-age=300, s-maxage=86400, stale-while-revalidate=604800` (plugin `useCacheableGet` em `services/graphql-api/src/build-server.ts`). Cache do CDN é por deploy. **Confirmado em produção:** `x-vercel-cache: HIT`.
  - Alternativa de arquitetura (não seguida, decisão em aberto): app importar `@cypher/content`/`@cypher/engine` direto no servidor, sem rede.
- [ ] **Fase 2 — Payload menor**: `abilities(ids:)` para a ficha; wizard pedir só o locale atual e carregar habilidades sob demanda. Rende pouco agora que os catálogos estão em cache.
- [ ] **Fase 3 — Waterfalls** (quase toda feita)
  - [x] `getPlayData` sem transação/lock: 3 leituras em paralelo com ownership no `join` (era ~8 idas em série).
  - [x] Ficha e play: `getCharacter` ‖ `getPlayData`.
  - [x] Play: `setPoolMax` via `after()`.
  - [x] Better Auth `session.cookieCache` (5 min): `getSession` sem ida ao banco na maioria das páginas (sessão revogada vale até 5 min).
  - [x] `loading.tsx` (ficha e play, `CharacterPageSkeleton`) + `<Link>`: `@cypher/ui` ganhou `LinkProvider`/`useLinkComponent` (padrão `<a>`), o app injeta `next/link` via `NextLinkProvider`. **Exceção:** play → ficha continua `<a>` (aviso `beforeunload` do "Syncing…"). Build de produção com servidor atrasado 2 s: skeleton em 71 ms.
  - [ ] **Próximo:** cache de `validateCharacterChoices` (determinístico pela entrada) — GET+CDN ou memo por instância. É a única chamada à API sem cache na abertura da ficha/play.
  - [ ] Selo "Rules Update" da lista em `<Suspense>`.
- [x] **Fase 4 — Infra**: Neon de produção em São Paulo; `vercel.json` com `"regions": ["gru1"]` no app e na API (sobrepõe o painel). **Confirmado em produção:** `play.csrd.app` e `api.csrd.app` com `x-vercel-id: gru1::gru1`.
  - [ ] Talvez: API pré-compilar conteúdo em JSON no build (evitar parse YAML+Zod no cold start). Conferir se a connection string do app é a pooled (`-pooler`).

## SEO — docs (csrd.app)

Já tinha: canonical, hreflang en/pt-BR, `description`, sitemap com hreflang (a Starlight configura i18n).

- [x] `apps/docs/public/robots.txt` (sitemap; `Disallow: /pagefind/` e `/sidebar-lists/`).
- [x] `/` → redirect 307 em `apps/docs/vercel.json` por `Accept-Language` (1º idioma, igual ao `preferredLocale` do app); `index.astro` vira fallback `noindex`; `/` fora do sitemap (`@astrojs/sitemap` configurado à mão com `filter` — antes aparecia como alternate "en" duplicado).
- [x] Home `/[locale]/` (fora da Starlight) ganhou canonical, hreflang, Open Graph, `WebSite` JSON-LD e imagem de compartilhamento.
- [x] **Fontes self-hosted** (Fonts API do Astro; `FontLinks.astro`; preload só de Inter e Space Grotesk, filtrado por `style` porque o Astro marca o preload de arquivo variável só com o 1º peso). Lighthouse mobile local: home 95→100, habilidade 86→99, regras 86→98.
- [x] **Sidebar (opção B + A)**: listas de Abilities/Cyphers em arquivos estáticos com hash (`/sidebar-lists/<locale>-<lista>.<hash>.html`, `immutable`), injetadas pelo `Sidebar.astro` (marca a página atual, abre o grupo, re-aplica a rolagem por causa do scroll anchoring). Requisito: todos os itens continuam na navegação (Ctrl+F). Página de habilidade 280→86 KB, DOM inicial 5.341→1.214, build 54→24 s. Testado no mobile.
- [x] Título do site por locale ("… | Referência do Cypher System").
- [x] JSON-LD `BreadcrumbList` (gerado em `Breadcrumbs.astro` a partir do breadcrumb visível).
- [x] `og:image` por idioma (`public/og/<locale>.png`, 1200×630, design aprovado por Matheus; `OgImage.astro`).
- [x] **Acessibilidade — Lighthouse 100** em todas as páginas testadas (mobile e desktop): nome do botão "CYPHER:// Main menu" (docs + app); botão e link REFERENCE com 31 px; links em texto corrido sublinhados; seções da página na sidebar com 25 px. Sobra só `label-content-name-mismatch` no botão de busca da Starlight (regra experimental, peso 0, sem efeito real para leitores de tela).
- [ ] Baixa: `apple-touch-icon` + `manifest`.
- [ ] Baixa: `DefinedTerm` (JSON-LD) no glossário.
- [ ] Baixa: copy pt-BR da home pensando em buscas ("Sistema Cypher", "ficha"); links docs → play com âncoras descritivas.

## SEO — app (play.csrd.app)

Quase tudo é privado: indexar só o público.

- [x] `app/robots.ts` (bloqueia só `/api/` — páginas privadas ficam rastreáveis para o `noindex` ser lido) + `app/sitemap.ts` só com `/en/auth` e `/pt-br/auth`.
- [x] `noindex` padrão em todo `/{locale}` (`app/[locale]/layout.tsx`); login é a única página com `index` (canonical sem `?next=`, hreflang en/pt-BR/x-default).
- [x] Título/descrição por locale (`lib/i18n/meta.ts`, título `"%s · Cypher System"`); textos pt-BR confirmados por Matheus.
- [x] `<html lang>` certo no servidor (`proxy.ts` seta `x-locale`, o root layout lê; `HtmlLang` continua para navegação client-side).
- [x] Imagem de compartilhamento por idioma (`ogImages()` em `lib/i18n/meta.ts`) + `twitter:card`.
- [ ] Opcional: landing pública em `/[locale]` para quem não está logado, em vez de ir direto para `/auth`.

## Lighthouse (2026-10-16)

- Produção, antes desta rodada (medido pelo Matheus): desktop 98 desempenho / 87 acessibilidade / 96 / 100 SEO; mobile **77** / 91 / 96 / 100.
- Local (`astro preview`, depois de tudo): desempenho 98–100 (mobile) e 100 (desktop); acessibilidade 100.
- Lighthouse contra `https://csrd.app` não roda no ambiente do Claude (o domínio raiz não resolve lá) — testar local ou pelo navegador.

## Aprendizados que valem para depois

- `pnpm --filter <pkg>` não recompila dependências: use `"<pkg>..."` depois de mexer em `@cypher/ui`, `@cypher/content` ou `@cypher/engine`.
- Metadata do Next se combina de forma rasa (um `openGraph` substitui o do pai inteiro), e o `title.default` de um layout também passa pelo template do layout de cima.
- Com `<Link>`, a URL só muda quando a página nova chega: testes e2e devem esperar com `toHaveURL` antes de ler `page.url()`.
- O prefetch do `<Link>` e o `loading.tsx` só se comportam como em produção num build (`next start`), não no `next dev`.
