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

## Error codes

Every rule violation `validateCharacterChoices` can report is a `CharacterRuleError` (`src/errors.ts`) with a stable `code` and `params`; its `message` stays the English sentence. `validateCharacterChoices` returns both `errors: string[]` and `issues: ValidationIssue[]` (same order and length), and graphql-api exposes `issues` so UIs can localize. When you add a new rule error, add a `RuleErrorCode`, throw `CharacterRuleError` with params, and add the translation in `apps/app/lib/i18n/wizard.ts`.

## Advancement purchases

An `AdvancementPurchase.tier` is the tier the purchase leads **to** (the four purchases tagged `tier: 2` take a tier-1 character to tier 2). `deriveTier` lets the _newest_ tier be partly bought — advancements are bought one at a time in any order, and the character only advances when the fourth lands — but an older tier with fewer than four is an error. Pool/Edge/Effort/skill effects apply as soon as each purchase is made, whatever the tier's completeness.

## Level-up picks (tier 2+)

`CharacterChoices.type_ability_picks` (tier -> ids) holds the Type abilities picked from tier 2 up; the count per tier is `Type.tier_choose_counts` and a pick may come from that tier or any lower one (`resolveTypeTierPicks`). `focus_choice_selections` is `Record<tier, string[]>` — the ability ids of the chosen option(s), so `count > 1` and bundled pairs work. A pick not made yet for tier 2+ is **not an error**: it appears in `DerivedCharacter.pending_picks` (right after a tier-up the player still owes them). Tier 1 stays strict. `MAX_TIER` (6) is enforced by `deriveTier` (`TIER_TOO_HIGH`).

## Flavors

`CharacterChoices.flavor_id` (+ `CharacterContent.flavor`, just `id` and `tier_abilities`) adds the flavor's abilities to the pool the Type picks come from: tier 1 in `tier_1_type_ability_ids`, later tiers in `type_ability_picks`, both via the optional `flavor` argument of `resolveTypeAbilities` / `resolveTypeTierPicks`. The pick counts are the Type's, unchanged. A flavor ability is a `KnownAbility` with source `{ kind: 'flavor' }` unless the Type also offers it (then it is the Type's). Skill-grant keys keep the `type:` kind. A `flavor_id` without matching content is `FLAVOR_UNKNOWN`.

## Flavor gained in play

`CharacterChoices.flavor_gain` (`{ flavor_id, swaps: [{ tier, replaces, with }] }`, `CharacterContent.flavor` = the gained flavor) is a flavor taken after creation (4 XP, `FLAVOR_GAIN_COST_XP`, or free from a character arc: the caller charges, the engine doesn't track XP). `applyFlavorGain` runs first in `deriveCharacter` and `validateCharacterChoices` and **rewrites the choices**: the gained flavor becomes `flavor_id` and each swap replaces the given-up ability by the flavor one in `tier_1_type_ability_ids` / `type_ability_picks[tier]`, so everything downstream (the pool for later picks, skill grants, choice abilities, pending picks, sources) sees an ordinary flavored character. A swap needs: `replaces` is a Type-offered ability picked at that `tier` and not trained by a Skills advancement; `with` is a flavor ability of that tier or lower, not offered by the Type (that would be an ordinary pick) and not already the character's; no repeats; and what was given up can't be picked again later. One flavor per character (`flavor_id` and `flavor_gain` together is `FLAVOR_GAIN_CONFLICT`). Codes: `FLAVOR_SWAP_REPLACES_INVALID`, `FLAVOR_SWAP_WITH_INVALID`, `FLAVOR_SWAP_DUPLICATE`, `FLAVOR_SWAP_REPICKED`. The number of swaps is unlimited (the GM decides). When the gain can't be applied, `validateCharacterChoices` reports it and checks the rest as if there were none.

## Choice abilities

An ability with a `choice` (`{ options, count }` in `@cypher/content`, the shape of a Focus `choice` entry without bundles: Blessing of the Gods, Cantrips) makes the player pick `count` of its `options`, themselves abilities. The caller passes `CharacterContent.ability_choices` (ability id -> choice); picks live in `CharacterChoices.ability_choices`, keyed `abilityChoiceKey(tier, abilityId)` (the Type skill-grant key format, `type:<tier>:<id>`: the choice ability is a Type pick even when it comes from a flavor). The picked abilities become `KnownAbility`s with the choice ability's source. A shortfall at any tier is a `{ kind: 'option' }` entry in `pending_picks`, never an error; too many, an option not offered, a repeat or an ability already known are (`ABILITY_CHOICE_*`). Only Type picks (tier 1 and `type_ability_picks`) are looked at, and an option can't itself have a `skill_grant` or a `choice`.

## Options learned for XP

`CharacterChoices.learned_options` (choice ability id -> option ids) holds options bought later (Cantrips: "spend 2 XP to learn two cantrips"), by `resolveLearnedOptions`. The rule is data: a choice ability whose `choice.learn` is `{ xp_cost, count }`, and only a character whose **flavor lists that ability** may learn from it (`LEARN_NOT_AVAILABLE`; for Cantrips that is Modern Magic only, even if they never took Cantrips). Options come `count` at a time (`LEARN_COUNT`), must be among the ability's options (`LEARN_INVALID`) and not already known or repeated (`LEARN_DUPLICATE`; it runs after `ability_choices`, so a cantrip picked at creation counts). They become `KnownAbility`s credited to the flavor. The engine tracks no XP: the caller charges `xp_cost` per purchase. It is not an `AdvancementPurchase` on purpose — those count towards the four per tier.

## Skill-granting abilities

An ability with a `skill_grant` (`@cypher/content`: `{ count, options }`) trains the character in skills they pick. The engine has no content I/O, so the caller passes `CharacterContent.skill_grants` (ability id -> grant); without it no ability grants anything and any `ability_skill_choices` is rejected. Picks live in `CharacterChoices.ability_skill_choices`, keyed `skillGrantKey(kind, tier, abilityId)` — one entry per time the ability was gained, because these abilities are **repeatable** ("select this ability multiple times"): `resolveTypeTierPicks` lets them be retaken at a later tier (still once per tier) and each retake needs different skills (`applyAbilitySkillGrants` rejects a skill already trained). A shortfall at any tier (tier 1 included, so characters saved before this existed still derive) becomes a `{ kind: 'skill' }` entry in `pending_picks`; only too many picks, a skill outside `options` or an already-trained skill is an error — creation flows must check `pending_picks` themselves. `options: 'noncombat'` excludes `CharacterContent.combat_skill_ids`; neither list is checked against the skill catalog here — callers with the catalog (graphql-api) should. `skill_grant.mode` says what a pick does: `train` (default; a skill not yet trained), `train_or_specialize` (Greater Skill with…, Heightened Skills; trained skills become specialized, specialized ones are refused) or `specialize` (Mastery with…; the skill must already be trained). `repeatable` (set only where the text says "select this ability multiple times") is what lets `resolveTypeTierPicks` accept a second pick at a later tier; a skill can't be chosen twice for the same ability. `allow_custom` lets a pick be a typed `custom:<text>` skill (any text up to 60 characters; no catalog check, no combat/physical filter — the player and GM judge it), kept in `skills` under that id and compared ignoring case/spacing. `alternate` is a second shape ("two skills, or specialized in one": Learned a Few Things, You Studied): the picks are of that shape when there are exactly `alternate.count` of them, so the counts must differ; until one shape is complete the pick is pending with `alternate_required` set. Picks are applied through `createSkillGrantApplier` interleaved with the 'skills' purchases: a purchase tagged tier N comes before the picks made on reaching N (so Mastery can specialize a skill a tier-N purchase just trained).

## Known gaps

- **Advancement "OTHER OPTIONS" substitutions** (reduce Speed Effort cost for armor by 1, +2 to recovery rolls, select another special ability from your Type at your tier or lower) aren't modeled. `deriveTier` explicitly rejects any purchase whose `option` isn't one of the 4 standard advancements, rather than silently mis-validating it. The "select another special ability" substitution in particular would need a new `AbilitySource` kind (`known_abilities` currently only has `'type'` and `'focus'` sources, since the standard advancement menu can only train an ability the character already knows, never grant a new one).
- **`Descriptor.inabilities` isn't auto-applied.** Unlike `skill_training`, this is prose (e.g. "hindered on all physical-attack tasks"), and real examples show it's often a whole task category rather than a single named skill — it doesn't map cleanly onto the `SkillLevel` enum `skills.ts` already uses for skill-scoped training/inability. It's exposed as content for display only; `applyDescriptorSkills` deliberately doesn't try to parse or apply it.
- **`Focus.type_swap_option` isn't modeled.** A few Foci let a player learn that specific Focus-granted ability instead of a Type ability at character creation. The content schema has the field, but `CharacterChoices` has no way to express choosing it, and neither `character.ts` nor `validate-character-choices.ts` consume it yet.
