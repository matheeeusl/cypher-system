# @cypher/engine

The Cypher System rules as plain TypeScript: given a character's choices and the rules content
they refer to, it works out the character (Pools, Edge, Effort, skills, abilities, tier) and
reports every rule the choices break.

Part of the [Cypher System monorepo](../../README.md).

## Principles

- **Pure functions.** Same input, same output; no I/O, no global state, no mutation of
  arguments. The caller loads content from [`@cypher/content`](../content/README.md) and passes
  it in.
- **No framework code.** No React, Next.js, Astro or DOM APIs, so it runs anywhere: the API, a
  build step, a test.
- **Choices in, character out.** Apps store only a character's choices and re-derive the rest,
  so a rules fix here reaches every saved character.

## Usage

```ts
import { validateCharacterChoices, deriveCharacter, effortCost } from '@cypher/engine'

// Every problem at once, for review screens and server-side save checks
const result = validateCharacterChoices(choices, content)
if (result.valid) {
  result.character // DerivedCharacter
} else {
  result.errors // English sentences
  result.issues // [{ code, params }], same order, for translating the messages
}

// Throws on the first problem; for when the choices are already known to be valid
const character = deriveCharacter(choices, content)

// Small rules helpers
effortCost(2, 1) // Pool points for 2 levels of Effort with Edge 1 → 4
```

`choices` is a `CharacterChoices`: the Type, Descriptor and Focus ids, the starting Edge and
Pool allocation, ability picks, advancement purchases and so on. `content` is a
`CharacterContent`: the Type, Descriptor, Focus (and Flavor) objects those ids point to, plus
the lookups some abilities need.

`DerivedCharacter.pending_picks` lists what a character still owes after a tier-up (Type
abilities, Focus choices, skills, an Edge). Owing a pick isn't an error; the app asks the player
for it.

## What it covers

| Module                          | Rules                                                                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `character.ts`                  | `deriveCharacter`: the full stat block                                                                                           |
| `validate-character-choices.ts` | `validateCharacterChoices`: every rule violation at once                                                                         |
| `advancement.ts`                | XP costs, advancements per tier, max tier, Other Options                                                                         |
| `effort-cost.ts`                | Effort cost with Edge and Weakness                                                                                               |
| `errors.ts`                     | `CharacterRuleError` and its stable error codes                                                                                  |
| `character/`                    | one file per rule: Pools, Edge, Effort, tier, Type and Focus abilities, Flavors, skill grants, choice abilities, cypher limit, … |

Advancement purchases are tagged with the tier they lead **to**: the four purchases tagged
`tier: 2` take a character from tier 1 to tier 2.

Not modeled yet: Descriptor inabilities are display-only prose, and a Focus's Type swap option
can't be chosen.

## Adding a rule

1. Write the Vitest spec first in `src/test/`, including the edge cases.
2. Put the rule in its own file (usually under `src/character/`) and re-export it from
   `src/index.ts` if callers need it.
3. If it can reject choices, throw a `CharacterRuleError` with a new code from `src/errors.ts`,
   and add that code's translations in `apps/app/lib/i18n/wizard.ts`.
4. Rebuild and check what depends on it:

   ```sh
   pnpm --filter @cypher/engine test
   pnpm --filter "@cypher/graphql-api..." build
   pnpm --filter @cypher/graphql-api test
   ```

## Scripts

| Script      | What it does       |
| ----------- | ------------------ |
| `build`     | Compile to `dist/` |
| `test`      | Vitest             |
| `typecheck` | `tsc --noEmit`     |
| `lint`      | ESLint over `src/` |

See [`CLAUDE.md`](CLAUDE.md) for how each rule is modeled and its error codes.
