# Advancement "Other Options" — engine + API + play mode

**Status: done (2026-10-17).** P1–P5 below were confirmed as written. Differences from the plan: `AdvancementPanel` needed no change (the Other row is a fifth `AdvancementStep`), and `SkillGrant.repeatable` is now exposed by the API so the app can offer repeatable abilities.

## Context

The rule (`apps/docs/src/content/docs/en/rules/experience-and-advancement.mdx`, "Other Options"; OG-CSPG ch. 1 pp. 20–21, same text as the Cypher System Rulebook p. 21 minus its "Additional possible advancements are detailed in Chapter 7" sentence):

> Once each tier, you can substitute a standard advancement for one of the following:
>
> - Reduce Speed Effort cost for wearing armor by 1.
> - Add +2 to your recovery rolls.
> - Select another special ability from your type from your tier or a lower tier.
>
> The GM might allow you to use this option to gain a second ability choice from your focus.

Today `deriveTier` rejects any purchase that isn't one of the 4 standard ones (`TIER_SUBSTITUTION_UNSUPPORTED`; "Known gaps" in `packages/cypher-engine/CLAUDE.md`). This was flagged as its own piece of work in `packages/content/GENRE-DESCRIPTORS-PLAN.md` (Dragon's "as an 'other' character advancement" depends on it) and `packages/content/FLAVORS-PLAN.md`.

## Decisions (Matheus, 2026-10-17)

- **Tier rule:** a tier still takes 4 purchases. The standard ones stay once each; **at most one** Other option per tier, and it takes the place of one standard advancement (3 standard + 1 Other closes the tier).
- **"Your tier"** = the tier the character has **when buying**. A purchase tagged tier N (bought at tier N−1) can take an ability of tier ≤ N−1.
- **Another Type ability** comes from the Type **plus the character's flavor** (the same pool as `type_ability_picks`).
- **Second Focus choice:** included, with a "talk to your GM first" warning only (no checkbox), like the flavor-gain panel.
- **Armor and recovery** become derived numbers shown on the sheet and in play mode (the app doesn't model armor or roll recovery dice).
- **Armor reduction has no cap.** It can be bought once per tier, like every Other option.
- **UI:** a fifth "Other option" row in the Advancement panel (see §5).
- **Wizard edit** that makes an Other ability impossible (different Type/Focus/flavor): **the save is refused**, the same as today's Skills purchase that trained an ability. The player undoes the advancement first.

## Details (proposed, then confirmed)

- **P1. Option ids:** `reduce-armor-speed-cost`, `recovery-roll-bonus`, `type-ability`, `focus-ability`. The first is what `character-tier.test.ts:58` already uses.
- **P2. Ability source:** a new `AbilitySource` `{ kind: 'advancement'; tier: number }`, labelled "Advancement (tier N)" on the sheet. This would apply even when the ability is a flavor ability. The alternative is to reuse `type`/`flavor`/`focus`, but then the sheet couldn't tell why the character has an extra ability.
- **P3. Second Focus choice needs the first one made.** The tier's normal `focus_choice_selections` entry must already exist before the extra one can be bought. That way the pending Focus picker and the extra pick can never collide. A bundled pair counts as one option, so it adds two ids.
- **P4. Repeatable abilities** (`skill_grant.repeatable`, e.g. Physical Skills) can be taken again through `type-ability`. Every other already-known ability is refused.
- **P5. What the sheet shows:** "Recovery roll: 1d6 + X" (X = tier + bonus) always. The armor line ("Armor Speed Effort cost −N") only when N > 0.

## 1. Engine — tier + numeric effects (`packages/cypher-engine`)

Test-first. Update `character-tier.test.ts` and add `character-advancement-other.test.ts`.

1. `src/character/types.ts`: four new variants in `AdvancementPurchase`:
   ```ts
   | { tier: number; option: 'reduce-armor-speed-cost' }
   | { tier: number; option: 'recovery-roll-bonus' }
   | { tier: number; option: 'type-ability'; ability_id: string }
   | { tier: number; option: 'focus-ability'; ability_ids: string[] }
   ```
   `DerivedCharacter` gains `recovery_roll_bonus: number` and `armor_speed_cost_reduction: number`.
2. `src/advancement.ts`: `OTHER_ADVANCEMENTS` (ids + effects), `RECOVERY_ROLL_BONUS = 2`, `ARMOR_SPEED_COST_REDUCTION = 1`.
3. `src/character/tier.ts` (`deriveTier`):
   - per tier: no repeated standard id (`TIER_DUPLICATE_OPTION`, as today);
   - at most one Other (new `TIER_OTHER_REPEATED`);
   - more than 4 purchases is an error (today implied by "4 distinct ids");
   - the tier completes at exactly 4.
   - `TIER_SUBSTITUTION_UNSUPPORTED` stays only for an unknown option string.
4. New `src/character/other-effects.ts`: `deriveRecoveryBonus` / `deriveArmorReduction` (count × constant). Like the other purchases, they apply as soon as bought, whatever the tier's completeness.

## 2. Engine — "another Type ability"

1. New `src/character/advancement-abilities.ts`, `resolveTypeAbilityPurchases(type, flavor, purchases, known)`. For each `type-ability`:
   - the ability is offered by the Type or flavor at tier ≤ `purchase.tier − 1`;
   - it isn't already known (P4);
   - it becomes a `KnownAbility` with the new source (P2).
   - New errors: `ADVANCEMENT_ABILITY_NOT_OFFERED` (`ability_id`, `tier`) and `ADVANCEMENT_ABILITY_KNOWN`.
2. Grant keys: `skillGrantKey`'s kind union gains `'advancement'`. The key is `advancement:<purchase.tier>:<id>`, distinct from `type:<tier>:<id>`, so a Physical Skills taken both ways in the same tier doesn't collide. `abilityChoiceKey` takes the kind (default `'type'`).
3. `collectSkillGrantInstances` (skill **and** Edge grants) and `collectAbilityChoiceInstances` also list the advancement abilities:
   - no `currentTier` filter (the purchase already happened);
   - sort order inside a tier: type → focus → advancement.
   - So Blessing of the Gods / Physical Skills / Improved Edge taken this way ask for their picks through `pending_picks` as usual.
4. `deriveCharacter`: resolve these right after the Type/Focus abilities and before `resolveAbilityChoices` / `resolveLearnedOptions`, so repeats are caught downstream. Do the same in `validate-character-choices.ts`.
5. `flavor-gain.ts`: needs nothing. A swap only touches Type picks, and `FLAVOR_SWAP_WITH_INVALID` already refuses an ability the character has. Add one test that pins this down.

## 3. Engine — second Focus choice

1. In the same module, `resolveFocusAbilityPurchases(focus, purchases, focus_choice_selections, known)`. For each `focus-ability`:
   - a Focus `choice` entry at tier ≤ `purchase.tier − 1` whose first selection exists (P3);
   - `ability_ids` cover exactly **one** option not already selected;
   - none of them already known.
   - Errors: `ADVANCEMENT_FOCUS_OPTION_INVALID` and `ADVANCEMENT_FOCUS_FIRST_CHOICE_MISSING`.
2. Same source (P2) and same `advancement:` grant keys as §2.

Then: update `CLAUDE.md` (replace the "Known gaps" bullet with a section) and remove the TODO comment in `types.ts` / `tier.ts`. Add each new error code to `RuleErrorCode`. Their en/pt-br text goes in `apps/app/lib/i18n/wizard.ts` (§5).

## 4. API (`services/graphql-api`)

- `schema.graphql`:
  - `AdvancementPurchaseInput` gains `reduceArmorSpeedCost: TierPurchaseInput`, `recoveryRollBonus: TierPurchaseInput`, `typeAbility: { tier, abilityId }` and `focusAbility: { tier, abilityIds }`;
  - `union AbilitySource` gains `AdvancementAbilitySource { tier: Int! }`;
  - `DerivedCharacterPayload` gains `recoveryRollBonus: Int!` and `armorSpeedCostReduction: Int!`;
  - `AdvancementRules` gains the two constants.
- `resolvers/validate/input-mapping.ts` / `output-mapping.ts`, plus tests in `input-mapping.test.ts`, `mappers.test.ts` and `validate-character-choices.test.ts`.
- Verify with `pnpm --filter "@cypher/graphql-api..." build` and its tests (the `...` rebuilds the engine first; see the root `CLAUDE.md`).

## 5. App (`apps/app`) + UI (`packages/ui`)

1. `lib/graphql/queries.ts`: the new input/output types and the `AdvancementAbilitySource` fragment.
2. `lib/advancement.ts`:
   - `AdvancementKey` / `AdvancementChoice` gain `armor`, `recovery`, `typeAbility { abilityId }` and `focusAbility { abilityIds }`;
   - update `advancementKeyOf`, `purchaseTier`, `toPurchase`, `parseChoice` and `choiceOf`;
   - new `otherBoughtAtTier(purchases, tier)`;
   - `tierOf` / `revertableIndexes` are unchanged (they only count).
3. `lib/play-view.ts`: the Other row's state and options.
   - Type abilities: Type + flavor, tier ≤ current, not known, repeatables allowed.
   - Focus options: reached choice entries whose first pick was made, minus the options already selected.
   - Hide the row when no Other is left this tier or the tier already has 4 purchases.
4. `play/actions.ts` → `purchaseAdvancementAction`:
   - once-per-tier now means one of each standard plus at most one Other;
   - XP and the graphql-api validation stay as they are.
   - **Undo** (`revertAdvancementAction` / `revertAdvancement` in `lib/play.ts`): undoing a `type-ability`/`focus-ability` purchase must also drop the `tier_picks` entries keyed `advancement:<tier>:<id>`. `picksUpToTier` doesn't catch them, because the tier may not change, and the engine would then refuse the undo with an `*_UNKNOWN` key error.
5. `@cypher/ui` `AdvancementPanel`:
   - an optional fifth "Other option" row ("replaces one step, once per tier") opening four choices;
   - the Type/Focus choices reuse the existing searchable picker;
   - the Focus one shows the GM warning;
   - update the stories. `PlayScreen.tsx` wires it up (`STEP_ORDER` stays the four standard steps).
6. Sheet + play Status: `character-sheet.ts` `quickStats` and the Status chips show the recovery roll and the armor reduction (P5). The abilities list labels the new source.
7. `lib/advancement-reason.ts`: XP-log lines for the four new choices.
8. i18n: `lib/i18n/play.ts`, `sheet.ts` and `wizard.ts` (engine error codes), en + pt-br. The pt-BR terms ("recovery roll", "Speed Effort cost"…) go through the `cypher-pt-br-translation` skill.
9. e2e (`e2e/play.spec.ts`): buy 3 standard + 1 Other (+2 recovery) to reach tier 2; buy a Type ability as an Other; undo it.

## 6. Docs and notes

- `apps/app/CLAUDE.md`: a bullet under Play mode.
- `packages/cypher-engine/CLAUDE.md`: the new section (§3).
- `GENRE-DESCRIPTORS-PLAN.md` / `FLAVORS-PLAN.md`: point to this plan. Dragon's route still waits for the Advancement lists, the flavor-for-XP route stays as it is.
- The docs page itself needs no change.

## Out of scope

- Applying the armor reduction to real armor (no armor in inventory/equipment math). The same goes for Practiced/Experienced in Armor.
- Recovery-roll dice in play mode.
- Descriptor Advancement lists and Dragon's "other advancement" (`GENRE-DESCRIPTORS-PLAN.md`).
- Rulebook Chapter 7's additional advancements (not in the OG-CSPG).

## Order of work

§1 → §2 → §3 (engine; each step green on `pnpm --filter @cypher/engine test` + typecheck), then §4, §5 and §6, with one commit per section.
