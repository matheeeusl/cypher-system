# @cypher/graphql-api

A public, read-only GraphQL API over the Cypher System rules, live at
[api.csrd.app/graphql](https://api.csrd.app/graphql). It serves the rules data from
[`@cypher/content`](../../packages/content/README.md) and validates characters with
[`@cypher/engine`](../../packages/cypher-engine/README.md).

It stores nothing: no database, no users, no sessions. The character app
([`apps/app`](../../apps/app/README.md)) is its main client.

Part of the [Cypher System monorepo](../../README.md).

## Stack

- [Fastify 5](https://fastify.dev) with [`@fastify/cors`](https://github.com/fastify/fastify-cors)
- [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server), schema-first from
  [`schema.graphql`](schema.graphql)
- Vitest for tests

## Schema

Every entity has a list query and a lookup by id:

```graphql
type Query {
  types: [Type!]!
  type(id: ID!): Type
  descriptors: [Descriptor!]!
  descriptor(id: ID!): Descriptor
  foci: [Focus!]!
  focus(id: ID!): Focus
  flavors: [Flavor!]!
  flavor(id: ID!): Flavor
  abilities: [Ability!]!
  ability(id: ID!): Ability
  skills: [Skill!]!
  skill(id: ID!): Skill
  cyphers: [Cypher!]!
  cypher(id: ID!): Cypher
  artifacts: [Artifact!]!
  artifact(id: ID!): Artifact
  oddities: [Oddity!]!
  oddity(id: ID!): Oddity

  advancementRules: AdvancementRules!
  validateCharacterChoices(input: CharacterChoicesInput!): ValidationResultPayload!
}
```

Text fields are `LocalizedString { en, ptBR }`. Each entity also carries a `contentVersion`
hash, which clients store to notice when the rules behind a saved character change.

`validateCharacterChoices` takes a character's choices (Type, Descriptor, Focus, picks,
advancement purchases) and returns a union:

- `ValidCharacterResult`: the derived character (Pools, Edge, Effort, skills, abilities, tier,
  and the picks still owed after a tier-up).
- `InvalidCharacterResult`: the rule violations, each as an English sentence in `errors` and as
  a `code` + `params` in `issues` (same order), so clients can show them in their own language.

Successful `GET` requests are sent with `Cache-Control` headers so the CDN can cache content
queries.

Example:

```sh
curl -s http://localhost:4000/graphql \
  -H 'content-type: application/json' \
  -d '{"query":"{ types { id name { en ptBR } } }"}'
```

GraphiQL is available at `/graphql` in a browser.

## Running locally

From the repo root:

```sh
pnpm install
pnpm --filter "@cypher/graphql-api..." build   # builds content and engine first
pnpm dev:api                                   # http://localhost:4000/graphql, reloads on change
```

The port comes from `PORT` (default `4000`). CORS allows `csrd.app`, `play.csrd.app` and any
`localhost` port; the list is in [`src/build-server.ts`](src/build-server.ts).

## Layout

```
schema.graphql          the SDL
src/index.ts            entrypoint: creates the Fastify instance and listens
src/build-server.ts     CORS, Yoga wiring; buildServer() is what the tests use
src/schema/             loads schema.graphql
src/resolvers/content/  queries over @cypher/content
src/resolvers/validate/ maps GraphQL input to engine choices and back
src/test/               Vitest suites
```

## Scripts

| Script      | What it does                  |
| ----------- | ----------------------------- |
| `dev`       | `tsx watch` on `src/index.ts` |
| `build`     | Compile to `dist/`            |
| `start`     | Run the compiled server       |
| `test`      | Vitest                        |
| `typecheck` | `tsc --noEmit`                |
| `lint`      | ESLint over `src/`            |

After changing `@cypher/content` or `@cypher/engine`, run this package's checks with the `...`
suffix so they're rebuilt first:

```sh
pnpm --filter "@cypher/graphql-api..." build
pnpm --filter @cypher/graphql-api test
```

## Deployment

### Vercel

Production runs on Vercel as a Fastify function (root `services/graphql-api`). Two things the
entrypoint has to respect:

- `src/index.ts` must import `fastify` itself, and no file in `src/` may be named `server.ts`
  or `app.ts`; otherwise Vercel's Fastify detection picks the wrong file.
- `listen()` must not be awaited; awaiting it makes every request hang on Vercel.

### Docker

The [`Dockerfile`](Dockerfile) builds the whole workspace and deploys a self-contained copy of
the API. Build it from the repo root:

```sh
docker build -t cypher-graphql-api -f services/graphql-api/Dockerfile .
docker run -p 4000:4000 cypher-graphql-api
```
