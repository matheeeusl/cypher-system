# Flavors — implementation plan

Source: `rulebook/cypherrules.pdf` is the **Old Gus' Unofficial Cypher System Player's Guide (OG-CSPG, 2025-09-17)**, Chapter 7 "Further Customization", pp. 410–440 (rules intro p. 410; Cantrips/spellcasting pp. 440–441+). Raw text of that range: `rulebook/flavors-extract.txt` (pdf.js extraction; re-extract rather than trust it for final wording).

> Content accuracy: this is an unofficial player's guide, not the Cypher System Rulebook the rest of `data/` was verified against. Every Flavor file should say so in a leading YAML comment, and `page_ref`-style provenance should name OG-CSPG.

## 1. What the book says

A **flavor** lets you, at each tier, exchange a Type ability for one from the flavor's list of the same tier. The exchanged ability can't be chosen later (example: Warrior "shinobi" swaps Bash for Danger Sense). Optional rule: the GM may instead just _add_ flavor abilities to the Type's choices. Flavors can be earned by a character arc or bought for 4 XP; a personalized flavor is built with the GM (out of scope for the tool).

Ten flavors (tiers 1–6 each):

| Flavor               | Pages   | Notes for modelling                                                                                                                         |
| -------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Charms and Figments  | 411–413 | plain abilities                                                                                                                             |
| Combat               | 414–415 | many abilities **without a cost** (Practiced in Armor, Skill With Attacks/Defense, Mastery…) — enablers, some with `skill_grant`-like picks |
| Cozy Magic           | 416–418 | plain abilities                                                                                                                             |
| Divination           | 419–421 | plain abilities                                                                                                                             |
| Magic                | 422–426 | T1 **Blessing of the Gods**: pick 2 of 9 sub-abilities; links to the spellcasting rule                                                      |
| Modern Magic         | 427–429 | T1 **Cantrips (choose any four)** from the cantrip list (p. 441+)                                                                           |
| Protection           | 430–431 | tiers 2/5/6 have unnamed-cost abilities                                                                                                     |
| Skills and Knowledge | 432–433 | mostly skill-granting abilities → `skill_grant`                                                                                             |
| Stealth              | 434–436 | plain abilities                                                                                                                             |
| Technology           | 437–439 | plain abilities                                                                                                                             |

~146 abilities have a printed cost; **89 of those ids already exist** in `data/abilities/` (Danger Sense, Spray, Fetch, Mind Control…) because Types/Foci print them too. Those only need a new `sources` entry (after checking the text matches); ~57 plus the cost-less ones are new files.

## 2. Modelling decision (recommended)

**Treat flavor abilities as extra options in the Type's pick pool**, not as explicit give/take swap pairs.

- Picking N abilities from (Type list ∪ flavor list) is equivalent to "exchange Type abilities for flavor ones": the pick count is unchanged, each id can be picked once ("you can't choose Bash later" falls out for free), and it is also exactly the book's alternative reading ("flavors just add to your choices").
- It reuses everything that exists: `tier_choose_counts`, tier 2+ "this tier or lower" picks, `pending_picks`, `AbilityPicker`, `skill_grant`.
- Cost: loses the literal "which Type ability did I give up" record. Nobody needs it for validation; if the sheet should show it, derive it later.

## 3. Phases

### Phase 1 — `@cypher/content`

1. `schemas/flavor.ts`: `FlavorSchema { id, name, description, tier_abilities: Record<'1'..'6', string[]>, … }` (list of ability ids; no choose-counts — those stay on the Type). Magic's Blessing of the Gods and Modern Magic's Cantrips need a **bundle entry**; decide shape in phase 0 (see questions).
2. `ability.ts`: extend `sources[].type` to `'type' | 'focus' | 'flavor'`.
3. `data/flavors/<id>.yaml` ×10 and ~57+ new `data/abilities/*.yaml`; append `flavor` sources to the 89 existing ones. Translate pt-BR through the `cypher-pt-br-translation` skill.
4. Loader accessors `getAllFlavors/getFlavorById`, export from `index.ts`, `WithVersion` like the other entities.
5. `src/test/loader.test.ts`: every flavor ability id resolves; tier of the flavor source matches the flavor's `tier_abilities` key.
6. Flag attack abilities (`attack: true`) among the new ones; set `action_type` (extend the enum only if a printed tag is new).

### Phase 2 — `@cypher/engine`

- `CharacterChoices.flavor_id: string | null`. Tier 1 and tier 2+ pools (`resolveTypeTierPicks`) accept flavor abilities of tier ≤ the pick's tier. New `CharacterRuleError` codes: unknown flavor, ability not in Type or Flavor pool. Known-abilities gets a `'flavor'` source (also lets the Skills advancement train a flavor attack ability).
- Tests first (project rule): flavor ability accepted/rejected by tier, no duplicates, flavor `skill_grant` flows through `applyAbilitySkillGrants`.

### Phase 3 — `services/graphql-api`

- Schema: `Flavor` type, `flavors`/`flavor(id)` queries, `AbilitySource` gains `flavor`, `flavorId` on the choices input of `validateCharacterChoices`; map the new error codes into `issues`. Verify with `pnpm --filter "@cypher/graphql-api..." build` (stale `dist/` otherwise).

### Phase 4 — `apps/docs`

- `pages/[locale]/flavors/index.astro` + `[slug].astro` (model on `foci/`, reuse `AbilityEntry`), `flavorsSidebarGroup` in `astro.config` (collapsed, like abilities).
- `abilities/[slug].astro`: render `flavor` sources (today it assumes type/focus).
- Rules page: a "Flavors" section in `rules/character-creation.mdx` (en + pt-br) and a glossary entry; short Cantrips/spellcasting note.
- `WizardCallout` + `lib/app-links.ts` link from the flavor step, mirroring the Focus step ↔ docs link added in c51bdc0.

### Phase 5 — `apps/app` wizard

- `WizardChoices.flavorId: string | null` (optional step, **default none**): either a new `flavor` step between Focus and Pools, or a selector inside the Abilities step. Recommended: inside Abilities — it only changes that step's pool, avoids a 10th stepper item, and the flavor choice is only meaningful next to the picks.
- `AbilitiesStep`: when a flavor is chosen, merge its tier-1 abilities into the list with a "Flavor" badge; `derive.ts` step validity/`buildCharacterChoicesInput`; skill-grant pickers keep working (`type:1:<id>` key → decide whether flavor grants use `flavor:` kind; the engine's `skillGrantKey` and the `SKILL_KEY` regex in `lib/tier-picks.ts` currently only know `type|focus`).
- Persistence: `flavorId` is an optional field of the `choices` JSON (no SQL migration; old rows parse as `null`) — update `lib/characters-input.ts`, `lib/wizard-draft.ts`, `lib/prepare-character.ts`, `contentVersions` (+ "Rules Update" badge) and `summary`.
- Play mode: tier-up `AbilityPicker` options include the character's flavor pool; changing/removing the flavor in the edit wizard must clear impossible picks (same rule as Type/Focus changes).
- i18n in `lib/i18n/wizard.ts` (en + pt-br, same keys) + issue-code translations; character sheet shows the flavor name next to Type/Descriptor/Focus (`@cypher/ui` `CharacterSheet`, plus the "Eu sou um(a)…" sentence only if you want it).
- e2e: extend `wizard.spec.ts` (en + pt-br) with a flavored character; add a play-mode tier-2 pick from the flavor.

### Out of scope (now)

Personalized flavors, gaining a flavor in play (4 XP purchase / character arc — add later as an "OTHER OPTIONS" advancement, which the engine rejects today), the full cantrip catalog and spell-preparation rules (`Preparing spells`, recovery-roll activation) — separate follow-up.

## 4. Decisions (2026-10-15)

1. Bundles (Blessing of the Gods, Cantrips): reuse the Focus `choice` shape — decided when the Magic / Modern Magic batch starts (`tier_abilities` is `string[]` for now; widen it then).
2. pt-BR term for "Flavor": **pending, Matheus is checking.** Until then `description.pt-BR` of every flavor is `""` and the docs label falls back to "Flavor". Flavor names themselves ("Combate", "Furtividade") are plain words.
3. Delivery: in batches. Pipeline first with Combat + Stealth, then the rest.
4. Combat's cost-less abilities (armor, defense training) stay **display text only**; the engine derives nothing from them.
5. Wizard: flavor selector inside the Abilities step; flavor abilities join the Type's pick pool.

## 5. Batches

| Batch | Scope                                                                                                                                                                                                                                                                                                                          | Status |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 1     | Phase 1 for Combat + Stealth (schema, `flavors` loader, 17 new abilities, `flavor` sources on 22 existing, sync test) + the `FLAVOR` GraphQL enum + docs ability page tolerating `flavor` sources                                                                                                                              | done   |
| 2     | Engine (`flavor_id`, pool validation, `FLAVOR_UNKNOWN`, `flavor` ability source) + GraphQL `Flavor` type, `flavors`/`flavor` queries, `flavorId` input, `FlavorAbilitySource`                                                                                                                                                  | done   |
| 3     | Docs: `/flavors` index + pages, sidebar group, `flavor` EntityLink, ability page links, rules section, glossary (pt-BR prose stubbed; term centralised in `apps/docs/src/lib/flavor-term.ts`)                                                                                                                                  | done   |
| 4     | Wizard (selector in the Abilities step), persistence (`flavorId` in the choices JSON, content version), play-mode level-up pickers, sheet label, i18n, e2e (`wizard.spec.ts`, `flavor-play.spec.ts`)                                                                                                                           | done   |
| 5     | Content: Charms and Figments, Cozy Magic, Divination, Protection, Skills and Knowledge, Technology (44 new abilities, `flavor` sources on ~80 existing, new action type `action_to_prepare_and_initiate`)                                                                                                                      | done   |
| 6     | Magic and Modern Magic, with **choice abilities** (`Ability.choice`, new `ability` source type, engine `ability_choices` + `option` pending picks, GraphQL `abilityChoices`, wizard picker, play-mode picker, docs list of options): Blessing of the Gods (2 of 13), Cantrips (4 of 50), 18 new abilities plus the 50 cantrips | done   |
| —     | Left: fill the pt-BR term for "flavor" (`apps/docs/src/lib/flavor-term.ts`, `terms.flavor`, `abilities.flavor`, `description.pt-BR` of the ten flavors). Not modeled: learning cantrips for 2 XP and the spell preparation / activation rules (pp. 440–441)                                                                    | next   |

Batch 1 notes:

- The OG-CSPG prints a **different "Gambler"** under Stealth tier 3 (lucky/unlucky numbers) than the existing `gambler` ability (Gambles It All Away, table games). The new one is `gambler-lucky-numbers`; both share the name "Gambler".
- Existing pt-BR inconsistency noticed, not touched: "asset" is "recurso" (glossary, Opportunist) but "bônus" in Surprise Attack.
- Not in the glossary, chosen by me and worth a look: Legerdemain → "Truques de Mão" (avoids clashing with the skill "Prestidigitação"), Get Away → "Escapar", Evanesce → "Desvanecer", Inner Defense → "Defesa Interior".
- The GraphQL `ActionType` enum only has 4 of the content's 28 action types; the new abilities only use those 3, but a later flavor with another tag will need the enum widened.

Batch 5 notes:

- The PDF text comes out of the layout in the wrong order in places (Serv-0 and its upgrades trail other abilities; "True Senses" is fused to "Read the Signs"). Tiers were fixed by reading the item coordinates on pp. 437–438, not by trusting the text order.
- Same name, different ability: the Technology "Machine Bond" is `machine-bond-remote-device` (the existing `machine-bond` is the Hacks the Network version).
- One ability listed by several flavors/tiers is a single file with several sources: Tool Mastery (Skills and Knowledge tiers 2 and 4, Technology tier 2), Understanding (tiers 2 and 4), Safe Sex (Cozy Magic and Protection tier 2).
- Where the PDF prints a slightly different text for an ability that already exists, the existing text was kept and only a `flavor` source was added: Reading the Room (extra example sentences), Remote Viewing and Improvise (layout only).
- New action type `action_to_prepare_and_initiate` for Cloud Personal Memories ("Action to prepare; action to initiate").
- Thinking Ahead has `cost: null`: its Intellect cost is "variable" (the level of the condition's source), which is in the description.
- Extra Skill and Multiple Skills use `skill_grant.options: noncombat` (Multiple Skills' text doesn't exclude attacks and defense, but there is no closer option).
- Text dropped on purpose: the "(IOM, 72)" citation after Emotional Support Pet, and the stray "level 1" printed after Spectral Servant.
- pt-BR names I chose (not in the glossary): the six flavors (Feitiços e Ilusões, Magia Aconchegante, Adivinhação, Proteção, Perícias e Conhecimento, Tecnologia) and the 44 new abilities; "Safe Sex" → "Sexo Seguro", "STI" → "IST".

Batch 6 notes:

- Bundles were modeled as `Ability.choice` (options + count, the Focus `choice` shape without bundled pairs) on the **ability** that asks for the picks, not on the flavor: the flavor still just lists what can be taken, and a `choice` ability is one of those picks.
- The PDF prints the thirteen blessings as bullets inside Blessing of the Gods; the abilities already existed (Channels Divine Blessings), so only `ability` sources were added to them.
- The Cantrips section (pp. 441–445) lists **50** cantrips (the plan said ~55). All cost 1 Intellect point. The note about level-0 creatures stays on Bug Cantrip's text (it explains both pest cantrips).
- pt-BR names I chose, not in the glossary: "Cantrip" → "Truque" (listed under "Needs confirmation"), the 50 "Truque de/da …" names, the two flavors (Magia, Magia Moderna) and the 18 new abilities.
- The Magic flavor's Summon Giant Spider and Summon Demon keep their existing text (it already contains the creature stats).

## Follow-up plan (after batch 6)

Decisions (Matheus): F1 first; F2 and F3 (translations) are done in a separate chat; F4 only for characters who picked the **Modern Magic** flavor; F5 is modeled, with a short disclaimer to talk to the GM first; F6 is a docs page only; F7 skipped.

Everything above shipped in five commits (content, engine, API, docs, app). What is left, in the order I'd do it. Items marked **needs you** can't be finished without a decision or a translation from Matheus.

| Batch | What                                                                                              | Size   | Depends on        |
| ----- | ------------------------------------------------------------------------------------------------- | ------ | ----------------- |
| F1    | Widen the GraphQL `ActionType` enum to all 30 content action types                                | small  | **done**          |
| F2    | pt-BR review sheet: every name I chose, in one table to approve or correct; apply the corrections | medium | **needs you**     |
| F3    | pt-BR "Flavor" term and the ten flavor descriptions; remove the placeholders                      | small  | **needs you**, F2 |
| F4    | Learn two cantrips for 2 XP in play mode (PDF p. 441)                                             | medium | **done**          |
| F5    | Buy a flavor for 4 XP / gain a flavor in play (PDF p. 410)                                        | large  | **done**          |
| F6    | Spell learning (3 XP, tier gates) and spell preparation / activation (PDF p. 440)                 | large  | **done**          |
| F7    | Personalized flavors (GM-made lists)                                                              | —      | recommend: skip   |

### F1 — Widen `ActionType`

- Why: the schema has 30 action types, the GraphQL enum had 4. Any ability outside those four can't be queried with its `actionType`, which is why the app's abilities query doesn't fetch it.
- Do: add the missing values to `schema.graphql`, extend the mapper in `resolvers/content/enums.ts`, add a test that every `action_type` value in the content maps to an enum value (fails loudly the next time a type is added).
- Then, optional: have the wizard and sheet show the action type (Action / Enabler / …) next to each ability. Not required for the flavors.
- Verify: `pnpm --filter "@cypher/graphql-api..." build` and test.

### F2 — pt-BR review sheet

- Generate one table from the content: English name → my pt-BR name, grouped as (a) the 10 flavors, (b) the ~100 new abilities, (c) the 50 cantrips ("Truque de/da …"), (d) terms that aren't names ("Cantrip", "Safe Sex", "STI").
- You approve or correct row by row; I apply the corrections to the YAMLs and to the glossary, and move confirmed terms out of "Needs confirmation".
- Also check the existing inconsistency noticed in batch 1: "asset" is "recurso" in the glossary but "bônus" in Surprise Attack.
- Nothing is promoted to confirmed without your answer.

### F3 — "Flavor" term and descriptions

- Replace every placeholder: `apps/docs/src/lib/flavor-term.ts` (also the `astro.config.mjs` sidebar label, grep `FLAVOR_TERM`), `terms.flavor`, `abilities.flavor.*` and the review row in the app i18n, `fromFlavor` in `sheet.ts`, the glossary rows, and the "Tradução em breve." stubs in the rules page and glossary.
- Fill `description.pt-BR` of the ten flavor YAMLs (translate the PDF's intro paragraph of each).
- Verify: docs build, spot-check `/pt-br/flavors`, run the wizard e2e in pt-br.

### F4 — Learn cantrips for 2 XP (done)

The rule: "spend 2 XP to learn two cantrips (if they are available for you to learn)". Decision (D3): only characters who picked the **Modern Magic** flavor.

- It is **not** an advancement purchase: those count towards the four per tier, so a 2 XP purchase would break `deriveTier`. It is `learned_options` in the engine and `tier_picks.learned` in the app.
- Data-driven: `choice.learn` (`{ xp_cost: 2, count: 2 }`) on `cantrips`, and the rule "the character's flavor lists the ability" is what limits it to Modern Magic. No flavor is hard-coded.
- Engine (`resolveLearnedOptions`, test first), GraphQL (`learnedOptions` input, `AbilityChoice.learn`), app (`LearnPanel` in the Status tab, `learnOptionsAction` / `revertLearnAction`, a locked XP spend and a refund on undo), docs (a "Learning more" line on the Cantrips page), e2e (`learn-play.spec.ts`).
- Known gap: editing the character in the wizard so the learned cantrips become impossible (flavor changed) clears them but keeps the XP spent.

### F5 — Gain a flavor in play (done)

Decision (D1): modelled, with a short disclaimer to talk to the GM first.

**The rule (PDF p. 410).** A personalized flavor can be earned by a character arc, or bought for 4 XP "as a long-term benefit or character advancement". Gaining a flavor works like creating with one: it lets you exchange Type abilities for flavor abilities, and "if you gained your flavor after reaching tier 2, the GM might allow a few additional exchanges". An exchange is permanent: the Type ability you give up can't be picked later (the book's Bash example).

**Model.** Creating with a flavor already widens the pick pool (`flavor_id`). A flavor gained later needs the same pool for future picks **plus retroactive swaps** of picks already made. So:

- Engine: `CharacterChoices.flavor_gain?: { flavor_id, swaps: [{ replaces, with }] }`. `flavor_id` and `flavor_gain` together is an error (`FLAVOR_GAIN_CONFLICT`: one flavor per character; recommended, D4).
- The resolved flavor is `flavor_id ?? flavor_gain.flavor_id`, so everything flavors already do (the pool for future picks, the `Flavor` label, docs) keeps working.
- Swaps are applied by **rewriting the Type picks before resolving them**: `replaces` becomes `with` in `tier_1_type_ability_ids` or in `type_ability_picks[tier]`. Then skill grants, choice abilities, pending picks and sources all work through the existing machinery, keyed by the pick's tier (a swapped-in Physical Skills owes its skill picks at that tier).
- A swap is valid when: `replaces` is a Type ability the character holds from a Type pick (not Focus, not already a flavor ability) and isn't trained by a Skills advancement; `with` is an ability of the gained flavor of the same tier or lower than the pick it replaces (the same rule as the creation pool) and not already known; no ability is replaced or swapped in twice. The replaced ability can't be picked again later (`FLAVOR_SWAP_REPICKED`). Codes: `FLAVOR_GAIN_CONFLICT`, `FLAVOR_SWAP_REPLACES_INVALID`, `FLAVOR_SWAP_WITH_INVALID`, `FLAVOR_SWAP_DUPLICATE`, `FLAVOR_SWAP_REPICKED`.
- No cap on the number of swaps (the book says "a few", at the GM's discretion); the disclaimer carries that.
- Cost: `FLAVOR_GAIN_COST_XP = 4` in the engine, next to `ADVANCEMENT_COST_XP`, served by the existing `advancementRules` query. A gain granted by a character arc is free (D5, recommended: a "my GM granted it" option that charges nothing; the XP log says so).
- Storage: `tier_picks.flavorGain = { flavorId, swaps }` (no migration, left out while empty), like `learned`. Not an `AdvancementPurchase`, for the same reason as cantrips.
- Undo: removes the gain and refunds the XP; checked by the engine first (not revertable when a later pick depends on the flavor, e.g. a tier-3 Type pick taken from its list), like undoing an advancement.

**Batches**

| Batch | What                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1    | Engine, test first: `flavor_gain`, the pick rewrite, the five error codes, `FLAVOR_GAIN_COST_XP`. Integration tests in `validate-character-choices`.                                                                                                                                                                                                                                                                                                |
| G2    | GraphQL: `flavorGain` input (`flavorId` + `swaps`), content resolution for the gained flavor (`resolveContentOrThrow`), `flavorCostXp` on `advancementRules`, issue params. Tests.                                                                                                                                                                                                                                                                  |
| G3    | App data: `TierPicks.flavorGain` (parse, `isEmptyPicks`, `picksUpToTier` keeps it), the flavor in use is `choices.flavorId ?? tierPicks.flavorGain` in `loadDerived`, `buildCharacterChoicesInput`, `prepare-character` and the play actions; `gainFlavorAction` / `revertFlavorGainAction` reusing `applyLearn` / `revertLearn` (generalised to a picks purchase with a cost, possibly 0).                                                         |
| G4    | App UI: a "Gain a flavor" panel in the Status tab for a character with no flavor (pick the flavor, add exchanges row by row: ability to give up → ability to take; the GM disclaimer; pay 4 XP or "granted by my GM"); after gaining it shows the flavor, the exchanges and Undo. In the wizard's edit mode the flavor selector is replaced by "gained in play: X" (otherwise setting `flavorId` would conflict and clear the gain). i18n en/pt-br. |
| G5    | Docs: a paragraph on gaining a flavor in the Flavor section of the Character Creation chapter (en, pt-br) and the glossary. e2e `flavor-gain.spec.ts`: refused without XP, a swap, derived abilities, undo with refund, the free path. CLAUDE.md notes in the three packages.                                                                                                                                                                       |

**Decisions to confirm** (defaults in brackets):

- D4: one flavor per character; gaining is only offered to a character without one [yes].
- D5: a free "granted by my GM / character arc" path next to the 4 XP purchase [yes].
- D6: no cap on exchanges, GM disclaimer in the panel [yes].

**Risks**

- The wizard's edit mode clears picks that become impossible, which would wipe a gain and its swaps while keeping the XP spent (the same gap as learned cantrips). G4 mitigates it by locking the selector for a character that gained a flavor.
- pt-BR copy for the panel uses the "Flavor" placeholder term; it joins the list for the translation chat.

### F6 — Spells, preparation and activation (done: docs page only)

Large and mostly rules text (3 XP per spell, low/mid/high tier gates, activate by recovery roll or time, prepare up to three swaps after an hour). It also depends on the whole Chapter 9 spell list, which isn't in the content.

- **D2:** recommend not modelling it. Instead add a docs page that summarises the rules (EN and pt-BR) and link it from the Magic and Modern Magic flavors.

Done: `rules/spellcasting-and-psionics.mdx` (en and pt-br; the pt-BR uses "feitiço" and "habilidade psiônica", already in the Foci content, listed under "Needs confirmation" in the glossary), linked from the Magic and Modern Magic flavor pages. Nothing is modelled.

### F7 — Personalized flavors

GM-made lists approved per table. Out of scope for a content-driven app; skip.

### Decisions needed

- D1: model "gain a flavor in play" (F5)? Recommended: no.
- D2: model spell learning/preparation (F6)? Recommended: docs page only.
- D3: who may learn cantrips (F4)? Recommended: anyone who has the Cantrips ability (Modern Magic) or a flavor that grants it.
- The pt-BR term for "Flavor" (F3) and the review sheet answers (F2).

Suggested order: F1 and F4 now (no dependencies), F2 whenever you have time to review, F3 right after, F5/F6 only if you answer D1/D2 with yes.
