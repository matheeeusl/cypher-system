# Genre descriptors — implementation plan

Adds the 53 genre descriptors from OG-CSPG pp. 55–103 (Cyberpunk, Fairy Tale, Fantasy Species, Modern Magic, Post-Apocalyptic, Science Fiction Species, Superhero, Weird West) to content, docs and the character wizard. Source facts, page numbers and schema gaps: [`DESCRIPTORS-REFERENCE.md`](./DESCRIPTORS-REFERENCE.md). Raw text: `rulebook/descriptors-extract.txt`.

## Decisions (2026-10-16)

| Question                     | Decision                                                                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope                        | **Docs + app.** Every genre descriptor gets a docs page and can be picked in the wizard. Display: `Catfolk — Fantasy Species`; the 50 standard ones have no suffix. |
| Things the schema can't hold | **Prose in `characteristics`** (the Hideous/Lucky precedent): Armor, costed abilities, Advancement lists, Edge bonus, practiced/specialized, Mutant packages.       |
| Exception: Pools             | **Structured.** "Points to divide" and "pick one option" get a field, so the wizard asks and the engine computes. Fixes Hideous too.                                |
| pt-BR                        | **Translate with each group**, through the `cypher-pt-br-translation` skill; terms with no confirmed translation are flagged, not guessed.                          |
| Docs grouping                | **By genre**: sidebar subgroups and index sections in the book's p. 29 order (Standard first).                                                                      |

## Phase 1 — Fix the existing Pool-bonus bug (ships on its own)

Today the wizard sends only `descriptor.poolBonus[0]` (`apps/app/components/wizard/derive.ts:373`), and the engine takes one client-entered `descriptor_pool_bonus` that is never checked against content. Tongue-Tied (+2 Might, +2 Speed) and Resilient (+2 Might, +2 Intellect) lose their second bonus, and Clumsy loses its −2 Speed. (The `DescriptorSchema` comment also names Strong-Willed as a two-bonus descriptor, but its data and the PDF have only +4 Intellect; fix the comment.) Genre descriptors with two fixed bonuses (Furious, Frumious, Uncanny, Morlock, AI, Unmagical) would have the same problem.

**Done 2026-10-16.**

1. `@cypher/engine`: `derivePoolMax(type, allocation, descriptor, purchases)` applies **every** `descriptor.pool_bonus` entry from content. `CharacterChoices.descriptor_pool_bonus` is gone, so a client can no longer choose its own bonus.
2. `graphql-api`: `descriptorPoolBonus` is still accepted but `@deprecated` and ignored, so an app deployed before the API keeps working. Remove it once no deployed app sends it.
3. App: `derive.ts` no longer sends it.
4. Tests: engine pool tests for Tongue-Tied and Clumsy; an API test that a client sending the old field still validates.
5. **Saved characters: no migration needed.** The play page derives the maximums through the engine on every visit and rewrites `character.pool_max` when it differs (`play/page.tsx`), and the sheet always derives. Affected characters fix themselves on their next visit after the API is deployed.

## Phase 2 — Schema and shared data (`@cypher/content`)

**Done 2026-10-16** (schema, table, tests; items 3's data and 5 happen with the content).

1. `category`: `standard | cyberpunk | fairy-tale | fantasy-species | modern-magic | post-apocalyptic | science-fiction-species | superhero | weird-west`, **defaulting to `standard`**. The 50 standard files stay untouched: `content_version` hashes the raw YAML, so adding a key to each would mark every saved character as having stale rules. Genre files write `category` explicitly.
2. `connection_options`: exactly 4 **or empty** (Artificially Intelligent and Quintar print none). Docs and wizard hide the section when it is empty.
3. `pool_bonus_choice` (nullable, default `null`), on top of the fixed `pool_bonus`:
   - `{ kind: divide, points, stats }`: Hideous (4, all three), Addicted (2, might/speed), Luddite (4, might/speed), Amazing (2, all; plus its fixed +2 Speed), Incredible (2, all; plus fixed +2 Might), Sensational (4, all).
   - `{ kind: one-of, options: [[{stat, amount}…]…] }`: Sylph (+2 Intellect | +2 Speed), Rusted (+2 Might | +2 Intellect | +1 each).
   - Mutant stays prose (random rolls); Roach's +1 Speed Edge stays prose.
   - **Hideous's choice is added in phase 4**, together with the engine code that applies it. Adding it now would change its `content_version` (a "Rules Update" badge on Hideous characters) for a rule that doesn't apply yet.
4. `data/reference-tables/descriptor-categories.yaml` (`getDescriptorCategoryTable()`): per category `id`, `name`, the book's group intro (`intro`, `null` for Standard) and `page`. pt-BR names confirmed 2026-10-16 and added to the glossary: Padrão, Cyberpunk, Contos de Fadas, Espécies de Fantasia, Magia Moderna, Pós-Apocalíptico, Espécies de Ficção Científica, Super-Heróis, Faroeste Sobrenatural; "cyberware" stays in English.
5. Each genre file starts with a YAML comment naming OG-CSPG and the page, like the flavors.
6. `loader.test.ts`: the table lists exactly the enum's ids in order, with an intro for every genre; defaults apply; `connection_options` 0 or 4; `pool_bonus_choice` rejects 0 points, a repeated stat, a single option or an empty one.

## Phase 3 — Content: 53 YAML files

**Done 2026-10-16** (not committed yet). 103 descriptors in `data/descriptors/`. Every English string of the 53 new files (658, including skill notes and Advancement option names) and of the Mutant tables (186 rows + 5 intros) matches the PDF; the 50 standard files are untouched. The comparison scripts live in the session scratchpad, not the repo (the PDF is gitignored, so they can't run in CI).

How the book's lines were mapped (keep doing it this way):

| Book line                                                                      | Goes to                                                                          |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Pool line with only the number ("Superintelligent: +4 to your Intellect Pool") | `pool_bonus` / `pool_bonus_choice`; the name is dropped, like the standard files |
| Pool line with narrative (Addicted's Survivor, Luddite's Natural Fitness)      | structured **and** a characteristic with the text                                |
| Unnamed "Skill:"                                                               | `skill_training`, with `note` when the line adds a rule                          |
| Named line that trains catalog skills (Ghost's Sneaky)                         | characteristic **and** `skill_training`                                          |
| Named line that trains a skill not in the catalog (Corpo's Business Acumen)    | characteristic only (the Appealing "Resistant to Charms" precedent)              |
| "Inability:"                                                                   | `inabilities`                                                                    |
| Named drawback (Uncanny Valley, Fragile)                                       | characteristic                                                                   |
| "practiced" weapons (Dwarf, Elf, Gnome, Lizardfolk)                            | characteristic named "Skill", as printed, so the sheet never marks it trained    |
| Cost in the name ("Changeable (2 Intellect points)")                           | kept in the characteristic name, as printed                                      |
| Advancement list                                                               | one characteristic: the book's sentence + the option names                       |

Decisions made while doing it:

- **`skill_training[].note`** (optional `LocalizedString`, added to the schema): the rest of the book's line when it carries a rule — a condition (Bitter), a narrower choice (Uncanny: perception or stealth; Addicted: 2 of a list of 9), or a higher level (Elf: specialized). It replaces the docs-only `CHOICE_RESTRICTIONS` idea for new descriptors. Vicious, Hideous and Cruel lose such rules today; adding their notes is a follow-up (it changes their content_version).
- **hindered / eased → "dificultado" / "facilitado"** (glossary, confirmed). The 50 standard descriptors still say "prejudicado" 42 times: follow-up, same content_version caveat.
- **5 new skills**, each for an unnamed "Skill:" line with no catalog match: `lifting-and-throwing` (Mighty), `listening-and-hearing` (Bewitched), `stonework` (Dwarf), `knowing-your-own-kind` (Forgeborn), `playing-physical-games` (Canien). Close matches reuse catalog skills with a note ("positive social interactions" → `pleasant-social-interactions`, "detecting falsehoods" → `discerning-truth`, Dwarf's stone tools → `crafting`, Helborn's lore → `supernatural-knowledge`).
- **`restful-presence` not created.** An Ability needs a `sources` entry with a Type/Focus/flavor/ability and a tier; a descriptor source is a schema + API + docs change. It belongs with open question 3 (Advancement lists as real picks).
- **Sidebars are not modeled** (Furious's SHITS intrusion, Corpo's megacorp, Unmagical ×2, Forgeborn, Risen's sigil, Unforgiving's Revenge arc); each file's leading comment says which one it skips. The docs could show them later.
- **Mutant tables**: `data/reference-tables/mutant-mutations.yaml` (`getMutantMutationTable()`), ranges as printed like `focus-connections.yaml`; a test checks each table covers 1–100 once and that only cosmetic rows lack an effect.
- Book errors handled as planned: Furious's "Ability:" lines are `inabilities`; Ghost's "(188)" dropped; Corpo's missing word kept; "Trigger Happy" without hyphen; Incredible's last link keeps its missing period.

**Don't deploy between phase 3 and phases 4–6.** graphql-api serves the 53 new descriptors as soon as it is rebuilt, so the wizard would list them, but nothing applies `pool_bonus_choice` yet: Amazing, Incredible, Sensational, Addicted, Luddite, Sylph and Rusted characters would get Pools without their chosen points.

### pt-BR to review

**Reviewed 2026-10-16:** all confirmed and moved to the glossary. Frumious / Bandersnatch were settled last: Furiante / Bandersnatch.

Names and terms with no confirmed translation, chosen as candidates (the glossary covers none of them):

- Descriptor names: Artificially Intelligent → Inteligência Artificial; Amazing → Espetacular; Mighty → Poderoso; Uncanny → Insólito; Corpo → Corporativo; Engram → Engrama; Luddite → Ludita; Changeling → Trocado; Frumious → Frumioso; Nix → Nixe; Sylph → Sílfide; Unmagical → Não Mágico; Catfolk → Povo-Gato; Dragonfolk → Povo-Dragão; Lizardfolk → Povo-Lagarto; Halfling → Halfling; Helborn → Infernato; Forgeborn → Forjado; Grizzled → Calejado; Risen → Reerguido; Slick → Malandro; Trailblazing → Desbravador; Trigger Happy → Gatilho Fácil; Unforgiving → Implacável; Wily → Astuto; Canien, Felis, Flutter, Morlock, Quintar kept as is; Roach → Barata; Rusted → Enferrujado; Shiny → Reluzente.
- Carroll words: Frumious → Furiante and Bandersnatch → Bandersnatch (confirmed 2026-10-16; the first candidates were Frumioso / Babassuro); Curiouser / And Curiouser → Cada Vez Mais Curioso / E Cada Vez Mais Curioso.
- Character arcs named by Luddite: Cleanse → Purificação; Recover from a Wound (or Trauma) → Recuperar-se de um Ferimento (ou Trauma); Restoration → Restauração; Explore → Explorar; Growth → Crescimento.
- Other terms: chrome → cromo; SHITS kept, with the expansion translated; player intrusion → intrusão do jogador; Wild Hunt → Caçada Selvagem; Distinctive (mutation) → Marcante; "inability in X" → "inabilidade em X" (glossary has Inabilidade as the skill level).
- Quintar are written in the feminine (the book: they prefer to be addressed as female).
- Fixed after review: `enhanced-might-edge`, `enhanced-speed-edge` and `enhanced-intellect-edge` are now "Margem de … Aprimorada" (were "Bônus de … Aprimorado").

## Phase 4 — GraphQL API and engine

**Done 2026-10-16** (not committed yet).

- Engine: `CharacterChoices.descriptor_pool_choice` (`{ allocation }` or `{ option_index }`), checked and applied by `resolveDescriptorPoolChoice` inside `derivePoolMax`; five `DESCRIPTOR_POOL_CHOICE_*` codes, translated in `apps/app/lib/i18n/wizard.ts`. A missing answer is an error (a creation choice, like the 6-point allocation), not a pending pick.
- API: `Descriptor.category` (`DescriptorCategory`: id, name, intro, page), `Descriptor.poolBonusChoice` (union `DescriptorPoolDivide | DescriptorPoolOneOf`), `DescriptorSkillTraining.note`; input `descriptorPoolChoice: DescriptorPoolChoiceInput @oneOf { allocation, optionIndex }`.
- Content: Hideous now has its `pool_bonus_choice` (divide 4 among all three). Its content_version changed, so saved Hideous characters show the Rules Update badge.
- Also fixed after the phase 3 review: the three "Enhanced … Edge" abilities are "Margem de … Aprimorada".

**Deploy only together with phase 6** (phase 6 is done, so the two can ship together now). From now on a Descriptor with a Pool choice (Hideous and the 7 genre ones) is invalid without `descriptorPoolChoice`, and the current wizard doesn't send it: those characters can't be saved, and saved Hideous characters derive as invalid until they are edited in the new wizard.

## Phase 5 — Docs site

**Done 2026-10-16** (not committed yet). As planned below, plus: the genre badge links to the category's section of the index (`#<category-id>`); notes render as rows (pill + sentence) under the plain pills, through the new `SkillTrainingPill.astro`; nested sidebar groups got their own CSS (they inherited the top-level label look); `src/lib/descriptor-format.ts` holds the shared wording. Fixed on the way: Clumsy's −2 printed as "+-2", and the pt-br row label read "Velocidade Bônus de Reserva" (now "Bônus de Reserva de Velocidade"). Known limit: entries sort by English name in both locales (as every manual sidebar group does).

- `astro.config.mjs`: the Descriptors sidebar group becomes Overview + one subgroup per category (Standard expanded, genres `collapsed: true`). 103 entries don't need the Abilities/Cyphers static-list pattern.
- Index (`descriptors/index.astro`): one section per category with its heading and intro; the meta column also shows choice bonuses ("2 to divide", "+2 Intellect or Speed").
- Descriptor page: category badge in the header area ("Fantasy Species"); pool card shows `pool_bonus_choice`; Initial Link section is hidden when there are none; Mutant page renders the tables through `ReferenceTable.astro`.
- `CharacterSentence`, breadcrumb and eyebrow are unchanged (the eyebrow stays "DESCRIPTOR").

## Phase 6 — Character wizard (app)

**Done 2026-10-16** (not committed yet). As planned below. The list sorts by `category.page` (the book's order) then by the localized name; the choice is `DescriptorPoolChoicePicker.tsx`; `characters-input.ts` parses the new key. Fixed on the way: the Review's Pools row and the Pools step breakdown ignored the Descriptor's fixed bonuses (now both add them and the choice, through `descriptorPoolBonus` in `derive.ts`), and a negative bonus (Clumsy) printed as "+-2". New spec `e2e/descriptor-pool-choice.spec.ts` (Sensational divide, Sylph one-of in pt-br, genre search); the existing helpers needed no change. Full e2e suite: 36 passed.

- Descriptor step: `SearchableEntityList` `getMeta` shows the category for non-standard descriptors (`Catfolk — Fantasy Species`); the list is grouped or sorted Standard first. The search also matches the category name, so "cyberpunk" lists all five.
- Pool choice: when the selected descriptor has `pool_bonus_choice`, the step shows a stepper (divide) or radio (one-of). New `WizardChoices.descriptorPoolChoice`, default `null` in `INITIAL_CHOICES` (saved rows without it load fine, because `characters.ts` merges defaults). The step can't advance until the choice is complete.
- The character sentence and sheet use the plain name ("I am a Catfolk Warrior who…"), with no suffix.
- Review step and pool preview include the choice. Update the e2e helpers and `wizard.spec.ts`, and add one test with a divide descriptor (Sensational) and one with a one-of (Sylph).

## Phase 7 — Docs for future sessions

**Done 2026-10-16** (not committed yet). Written along the way and checked at the end: `packages/content/CLAUDE.md` (Descriptors: categories, `pool_bonus_choice`, what stays prose), `packages/cypher-engine/CLAUDE.md` (Descriptor Pools), `apps/docs/AGENTS.md` (nested sidebar group, shared wording), `apps/app/CLAUDE.md` (Descriptor step), `DESCRIPTORS-REFERENCE.md` §2 (in the repo) and §3 (each gap with its resolution), and the glossary (Frumious → Furiante, Bandersnatch kept; nothing left in "Needs confirmation").

`packages/content/CLAUDE.md` (Descriptors section: categories, `pool_bonus_choice`, what stays prose and why), `DESCRIPTORS-REFERENCE.md` §2 marked done, `apps/app/CLAUDE.md` if the wizard step changes shape.

## Open questions

1. ~~Saved characters' `pool_max`~~: answered by the existing code, see phase 1 item 5.
2. ~~**Genre filter in the wizard**~~: decided 2026-10-16 to keep it as is — all 103 in the book's order, the genre shown and searchable. A per-campaign restriction stays out of scope.
3. ~~**Advancement abilities**~~: decided 2026-10-16 — yes, treat them like flavors, later. See "Future plan" below.
4. ~~**Sidebar subgroup style**~~: decided 2026-10-16 and done — the subgroups follow the Rules group's hierarchy: the subgroup label is styled like an ordinary entry (same inset, muted, regular weight) and its entries hang from a hairline at the same inset as a chapter's sections. (An earlier request for white labels was withdrawn.)

## Future plan — Advancement lists as Type ability options

Not started. Seven descriptors (Chimera, Dragon, Ghost, Nix, Sylph, Forgeborn, Risen) print an Advancement list: "With the GM's approval, you can choose from these abilities instead of your type abilities." Today it is a prose characteristic ("Chimera Advancement"). The decision is to model it the way flavors are ([`FLAVORS-PLAN.md`](./FLAVORS-PLAN.md) §2): the list **widens the pool** the Type abilities are picked from; the number of picks doesn't change.

Sketch, by layer (same shape as the flavor work):

1. **Content:** a structured list of ability ids on the descriptor (e.g. `advancement_abilities`), checked by `loader.test.ts` to resolve; `Ability.sources` gains a `descriptor` source listing it back, as flavors do. The prose characteristic stays for display.
2. **Engine:** `resolveTypeAbilities` / `resolveTypeTierPicks` accept those abilities as picks, with a `{ kind: 'descriptor' }` `KnownAbility` source; skill grants and choice abilities flow through unchanged.
3. **API:** expose the list on `Descriptor`, and the new ability source.
4. **App:** play mode's level-up pickers offer them (not the wizard; see below), labelled with the descriptor and a "talk to your GM first" note (like the flavor-gain panel); the sheet credits the descriptor.
5. **Docs:** link each listed ability from the descriptor page.

Decided by Matheus, 2026-10-16:

- **Tier: always available, play mode only.** As long as the character has the descriptor, its Advancement abilities can be taken, at any tier. They are **not** offered by the wizard at creation (tier-1 picks stay Type + flavor); they appear only in play mode's level-up pickers. So step 4 above is play mode only, and the engine accepts them in `type_ability_picks` (tier 2+) but not in `tier_1_type_ability_ids`.
- **GM approval: just a warning**, no checkbox.
- **Dragon's "as an 'other' character advancement"** refers to the "other" advancement option (Cypher System Rulebook p. 21; the OG-CSPG's own copy of it is to be checked): "Once each tier, you can substitute a standard advancement for one of the following: reduce Speed Effort cost for wearing armor by 1; add +2 to your recovery rolls; select another special ability from your type from your tier or a lower tier. The GM might allow you to use this option to gain a second ability choice from your focus. Additional possible advancements are detailed in Chapter 7." It sits next to the four standard ones (Increasing Capabilities, Moving Toward Perfection, Extra Effort, Skills). The Other Options are modelled since 2026-10-17 ([`PLAN-advancement-other-options.md`](../../PLAN-advancement-other-options.md)); Dragon's extra route now only waits for the Advancement lists themselves (it would be a fifth Other Option, offered to Dragons).

Still open:

- **Changing descriptor** after picks were made from the list: clear them, like a flavor change does.
