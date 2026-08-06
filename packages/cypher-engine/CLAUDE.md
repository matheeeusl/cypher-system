# @cypher/engine — rules engine

Plain TypeScript implementation of Cypher System mechanics: pools, effort, ability costs, and related rules math.

## Rules for this package

- No framework imports. No React, no Next.js, no Astro, no DOM APIs — this package must be usable from either app (or a test runner) with zero UI dependencies. If a function needs a framework type to make sense, it belongs in `@cypher/ui` or the consuming app, not here.
- Pure functions only. Given the same inputs, a function here should always return the same output, with no hidden mutation of arguments and no reliance on ambient/global state.
- Test-first. Write the Vitest spec for a rule (e.g. effort cost math, pool depletion) before or alongside the implementation, not after. A rules engine is only trustworthy if its edge cases (zero pool, negative effort, etc.) are pinned down by tests.

## Current state

`src/index.ts` is a stub (`ENGINE_VERSION`, a placeholder `PoolName` type). Real modules for pools/effort/abilities don't exist yet — build them as separate files under `src/` rather than growing `index.ts` into a monolith, and re-export from there.

## Scope

This package does not read files or perform I/O. Functions take already-parsed data (plain objects/arrays) as arguments — loading and validating YAML from `@cypher/content` is a separate concern, handled by that package's own loader.

Input/output types for `character.ts` type-import from `@cypher/content` (`import type { ... }`) — erased at compile time, so this still holds; `@cypher/content` is a devDependency here, not a runtime one.

## Known gaps

- **Type ability resolution beyond tier 1** isn't modeled in `character.ts`. The "choose N" count for Type abilities varies by both tier and Type (e.g. Warrior is 4,2,3,2,3,2 across tiers 1-6; Adept is 4,1,2,1,2,1) and isn't captured anywhere in `TypeSchema` — only tier-1 content exists today for any Type. `resolveTypeAbilities` only ever resolves the tier-1 "choose four" pick. Extending this needs a schema addition (e.g. a choose-N-per-tier field) plus tiers 2-6 content for all 4 Types, as a follow-up task.
- **Advancement "OTHER OPTIONS" substitutions** (reduce Speed Effort cost for armor by 1, +2 to recovery rolls, select another special ability from your Type at your tier or lower) aren't modeled. `deriveTier` explicitly rejects any purchase whose `option` isn't one of the 4 standard advancements, rather than silently mis-validating it. The "select another special ability" substitution in particular would need a new `AbilitySource` kind (`known_abilities` currently only has `'type'` and `'focus'` sources, since the standard advancement menu can only train an ability the character already knows, never grant a new one).
- **`Descriptor.inabilities` isn't auto-applied.** Unlike `skill_training`, this is prose (e.g. "hindered on all physical-attack tasks"), and real examples show it's often a whole task category rather than a single named skill — it doesn't map cleanly onto the `SkillLevel` enum `skills.ts` already uses for skill-scoped training/inability. It's exposed as content for display only; `applyDescriptorSkills` deliberately doesn't try to parse or apply it.
- **`Focus.type_swap_option` isn't modeled.** A few Foci let a player learn that specific Focus-granted ability instead of a Type ability at character creation. The content schema has the field, but `CharacterChoices` has no way to express choosing it, and neither `character.ts` nor `validate-character-choices.ts` consume it yet.