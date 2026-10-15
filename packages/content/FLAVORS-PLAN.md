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
