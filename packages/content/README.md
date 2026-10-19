# @cypher/content

The Cypher System rules data: one YAML file per entity, validated with
[Zod](https://zod.dev) and loaded through typed accessors. Every other package reads rules from
here; nothing else hardcodes rules text.

Part of the [Cypher System monorepo](../../README.md).

## What's in it

| Category    | Folder              | Entries |
| ----------- | ------------------- | ------: |
| Types       | `data/types/`       |       4 |
| Descriptors | `data/descriptors/` |     103 |
| Foci        | `data/foci/`        |     141 |
| Flavors     | `data/flavors/`     |      10 |
| Abilities   | `data/abilities/`   |   1,222 |
| Skills      | `data/skills/`      |      79 |
| Cyphers     | `data/cyphers/`     |     166 |
| Artifacts   | `data/artifacts/`   |      15 |
| Oddities    | `data/oddities/`    |       2 |

`data/reference-tables/` holds the tables that aren't entities: weapon and armor categories,
price tiers, ammunition, Focus Connections, descriptor categories and the Mutant's mutations.

Every text field is bilingual: `{ en: "…", pt-BR: "…" }`.

## Usage

```ts
import { getAllTypes, getFocusById, getWeaponCategoryTable } from '@cypher/content'

const types = getAllTypes() // WithVersion<Type>[]
const focus = getFocusById('bears-a-halo-of-fire') // WithVersion<Focus> | undefined
```

Each entity has a `getAllX()` and a `getXById(id)`. Entities come back as `WithVersion<T>`:
the parsed data plus a `content_version` hash of its YAML file, which the character app stores to
spot characters built on rules that have since changed. Reference tables have their own
accessors and no version.

The package also exports each Zod schema (`TypeSchema`, `FocusSchema`, …) and its inferred type.

The loader reads the YAML from disk at runtime, so this package works in Node (build steps,
servers, tests) but not in the browser. Browser code gets the data through
[`services/graphql-api`](../../services/graphql-api/README.md).

## Adding or editing content

1. Create or edit `data/<category>/<id>.yaml`. The file name is the entity's `id`.
2. Run the tests, which parse every file and check the cross-references (a Descriptor's skills
   exist, a Flavor's abilities list it back, …):

   ```sh
   pnpm --filter @cypher/content test
   ```

3. Rebuild before checking anything downstream:

   ```sh
   pnpm --filter "@cypher/docs..." build
   ```

Content should be real rulebook text. Where the text isn't available yet, leave the field empty
and flag it rather than paraphrasing. Portuguese text follows the project glossary
([`.claude/skills/cypher-pt-br-translation/references/glossary.md`](../../.claude/skills/cypher-pt-br-translation/references/glossary.md)).

Editing an entity's YAML changes its `content_version`, which marks every saved character that
uses it as having a rules update.

## Sources

Most content comes from the Cypher System Rulebook. Flavors and the genre Descriptors come from
the unofficial _Old Gus' Cypher System Player's Guide_ (OG-CSPG) and say so in a comment at the
top of each file. Notes on specific entries are in:

- [`DESCRIPTORS-REFERENCE.md`](DESCRIPTORS-REFERENCE.md): how Descriptor text maps to fields
- [`GENRE-DESCRIPTORS-PLAN.md`](GENRE-DESCRIPTORS-PLAN.md): the genre Descriptor transcription
- [`FLAVORS-PLAN.md`](FLAVORS-PLAN.md): the Flavor transcription
- [`CLAUDE.md`](CLAUDE.md): conventions, field meanings and known gaps

## Scripts

| Script      | What it does       |
| ----------- | ------------------ |
| `build`     | Compile to `dist/` |
| `test`      | Vitest             |
| `typecheck` | `tsc --noEmit`     |
| `lint`      | ESLint over `src/` |
