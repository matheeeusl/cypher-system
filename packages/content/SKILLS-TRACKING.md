# Skills content — plan & tracking

**Status (2026-09-21): implemented.** Phases 0–5 are done; only the optional follow-ups in Phase 6 remain. This file is kept as the decision record — the "why" behind the skill ids — and can be deleted once Phase 6 is either done or dropped.

## 1. The gap that was found

|                                                |                                                                                                                                                                 |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Skills registered before                       | **4** — `breaking-inanimate-objects`, `climbing`, `jumping`, `perception`                                                                                       |
| Distinct `skill_id`s referenced by Descriptors | **51**, of which **48 did not resolve** (42 of 50 Descriptors affected)                                                                                         |
| "Choose N skills" entries                      | 5: Calm (4, nonphysical), Creative (1, a creative skill), Intelligent (1, an area of knowledge), Learned (3, areas of knowledge), Mad (1, an area of knowledge) |
| Effect on the docs site                        | Descriptor pages showed raw kebab-case ids (`[identifying-and-using-plants]`); there was no Skills page or sidebar group at all                                 |
| Effect on the engine                           | None — `applyDescriptorSkills` keys its skill map by any string and never looks the id up in the catalog                                                        |
| Other entities referencing skills              | None — `types` (`starting_skills: []`), `foci` and `abilities` have no `skill_id` references                                                                    |

The rulebook has **no definitive skill list** (Chapter 2, "Skills") — only an illustrative one (~36 entries) plus the note that players can invent personalized skills. Descriptors grant training in free-form phrases, so the missing ids were a mix of single skills, defense-task categories, descriptor-specific task phrases, and a few ids that bundled several skills.

## 2. Decisions (all took the recommended default)

- [x] **D1 — Granularity: normalize only true compounds and clear synonyms; keep everything else literal.** Checked against the source sentence of every affected Descriptor. Many `X-and-Y` ids turned out to name _one_ task category ("balance and careful movement", "identifying or assessing danger, lies, quality…") and stay as single Skills; only ids that list independent skills were split.
- [x] **D2 — Defense skills are ordinary Skill entities** (`might-`/`speed-`/`intellect-`/`sanity-defense`). Revisit if defense rolls get their own engine module.
- [x] **D3 — "Choose N" restrictions are not modeled in the schema.** `SkillSchema` stays uncategorized (the book says there is no categorized list). The restriction is shown as text on the Descriptor page, from a small id-keyed table in `descriptors/[slug].astro`.
- [x] **D4 — Descriptor YAMLs were edited in place** (no alias map). Nothing persists character choices yet, so no stored id could break.
- [x] **D5 — Translations:** every new Skill has a real `pt-BR` **name**; `pt-BR` **descriptions** use the `"Tradução em breve."` placeholder, like most other pending content. (`jumping` and `breaking-inanimate-objects` also got their `pt-BR` names filled in, since they showed the placeholder as a pill label.)

### Cluster resolutions

| Cluster                                                                                                                                                          | Outcome                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deception` / `lies-and-trickery`                                                                                                                                | **Merged** into `deception` (Clever and Stealthy repointed): same concept, "interactions involving lies or trickery".                                                                                                                                                                 |
| `breaking-things` (Clumsy) / `breaking-inanimate-objects` (Strong)                                                                                               | **Merged** into the already-registered `breaking-inanimate-objects`. Clumsy's text says "breaking things"; treated as the same skill.                                                                                                                                                 |
| `climbing-jumping-running-swimming`, `disguise-and-stealth`, `geography-and-history`, `intimidation-and-fear`                                                    | **Split** into their component skills; owning Descriptor now lists one entry per skill. Hideous's condition on fear-based interactions ("if you show your true face") is **not represented anywhere in the data** — `skill_training` carries only an id, no conditions (see Phase 6). |
| `stealth` vs `sneaking`                                                                                                                                          | **Kept separate** — the rulebook's own skill list has both.                                                                                                                                                                                                                           |
| `illusions-and-trickery`, `seeing-through-tricks`                                                                                                                | **Kept separate** from `deception`: the first applies to _special abilities_, the second is the opposite direction (detecting, not doing).                                                                                                                                            |
| `intimidation` vs `fear-based-interactions`                                                                                                                      | **Kept separate** — Hideous's text names them as two things ("intimidation and any other fear-based interactions").                                                                                                                                                                   |
| `identifying` / `identifying-and-assessing` / `identifying-objects-and-trivia` / `identifying-and-using-plants` / `understanding-machines` / `-the-supernatural` | **Kept separate:** each has a distinct scope in its Descriptor's wording.                                                                                                                                                                                                             |
| `discerning-truth` / `discerning-true-motives` / `sensing-emotions`; `social-interaction` / `pleasant-social-interactions`                                       | **Kept separate:** overlapping but not equivalent (e.g. Empathic is trained in social interaction "pleasant or otherwise").                                                                                                                                                           |
| `resisting-mental-effects` / `resisting-interrogation` / `focus-and-concentration` / `intellect-defense`                                                         | **Kept separate**, but `resisting-mental-effects` (Strong-Willed) and `intellect-defense` (Clever: "defense rolls to resist mental effects") may be the same rule in practice. Worth a second look if defense rolls get modeled.                                                      |

## 3. What was done

Result: **51 Skills** (4 original + 47 new), **6 Descriptors edited** (rugged, hideous, inquisitive, clever, stealthy, clumsy), all 51 referenced ids resolve.

- [x] **Phase 0 — Decide.** D1–D5 and the clusters above, each checked against the rulebook's Descriptor text (chapter 2).
- [x] **Phase 1 — Guard rail.** `src/test/loader.test.ts`: every `Descriptor.skill_training[].skill_id` and `Type.starting_skills` entry must resolve to a registered Skill; the failure message lists every dangling id at once. Verified by mutation (a typo'd id fails it). No allowlist was needed since the data was fixed in the same change.
- [x] **Phase 2 — Atomic skills** added to `data/skills/`.
- [x] **Phase 3 — Defense skills and task phrases** added.
- [x] **Phase 4 — Compounds and clusters** applied (splits and merges above).
- [x] **Phase 5 — Site.**
  - `apps/docs/src/pages/[locale]/skills/[slug].astro`: one page per Skill per locale, with a "Granted by" list of Descriptors (reverse lookup over `skill_training`).
  - `astro.config.mjs`: Skills sidebar group (alphabetical, expanded, like Foci); `src/lib/page-context.ts`: breadcrumb/eyebrow labels (`Skills` / `Perícias`).
  - `descriptors/[slug].astro`: skill pills link to their Skill page; "Choose N" pills carry the restriction text (D3).
- [ ] **Phase 6 — Optional follow-ups** (not done):
  - [ ] `Descriptor.inabilities` is prose and isn't linked to skills (see "Known gaps" in `packages/cypher-engine/CLAUDE.md`); several inabilities name the same task categories as these skills (`climbing`, `running`, `jumping`, `swimming`). The catalog is now the prerequisite if that gets structured.
  - [ ] **Conditional skill training is lost.** Some Descriptors attach a condition to a skill: Hideous ("intimidation and any other fear-based interactions, _if you show your true face_") and Tongue-Tied (initiative, "_unless it's a social situation_"). `skill_training` entries have no field for this, so those pills over-state the training. Fixing it needs an optional `condition: LocalizedString` on the entry (a schema change that touches the graphql mapper) — not attempted here. (Clumsy's similar condition is fine: that training lives in its "Inelegant" characteristic as prose, not in `skill_training`.)
  - [ ] `services/graphql-api`: consider a `Descriptor.skillTraining { skill { … } }` resolver so clients don't need a second lookup.
  - [ ] Fill the `pt-BR` skill **descriptions** (currently the placeholder), together with the Descriptor translation pass.
  - [ ] Add `skill` to `EntityLink.astro` if a narrative chapter ever needs an inline `[Skill: …]` pill.

## 4. Outcome per originally-unresolved id (48)

| Done | `skill_id`                          | Outcome                                                    | Referenced by                                            |
| ---- | ----------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------- |
| [x]  | `balance-and-careful-movement`      | added as-is                                                | graceful                                                 |
| [x]  | `breaking-things`                   | merged → `breaking-inanimate-objects` (already registered) | clumsy                                                   |
| [x]  | `climbing-jumping-running-swimming` | split → `climbing`, `jumping`, `running`, `swimming`       | rugged                                                   |
| [x]  | `deception`                         | added as-is                                                | dishonorable                                             |
| [x]  | `discerning-true-motives`           | added as-is                                                | honorable, virtuous                                      |
| [x]  | `discerning-truth`                  | added as-is                                                | guarded                                                  |
| [x]  | `disguise-and-stealth`              | split → `disguise`, `stealth`                              | hideous                                                  |
| [x]  | `escaping-danger`                   | added as-is                                                | craven                                                   |
| [x]  | `exploiting-pain`                   | added as-is                                                | cruel                                                    |
| [x]  | `focus-and-concentration`           | added as-is                                                | strong-willed                                            |
| [x]  | `foraging-and-survival`             | added as-is                                                | exiled                                                   |
| [x]  | `geography-and-history`             | split → `geography`, `history`                             | inquisitive                                              |
| [x]  | `handling-animals`                  | added as-is                                                | rugged                                                   |
| [x]  | `identifying`                       | added as-is                                                | skeptical                                                |
| [x]  | `identifying-and-assessing`         | added as-is                                                | clever                                                   |
| [x]  | `identifying-and-using-plants`      | added as-is                                                | rugged                                                   |
| [x]  | `identifying-objects-and-trivia`    | added as-is                                                | perceptive                                               |
| [x]  | `illusions-and-trickery`            | added as-is                                                | stealthy                                                 |
| [x]  | `initiative`                        | added as-is                                                | brash, impulsive, sharp-eyed, swift, tongue-tied         |
| [x]  | `intellect-defense`                 | added as-is                                                | chaotic, clever, guarded, resilient, virtuous            |
| [x]  | `intimidation`                      | added as-is                                                | dishonorable, perceptive                                 |
| [x]  | `intimidation-and-fear`             | split → `intimidation`, `fear-based-interactions`          | hideous                                                  |
| [x]  | `learning-new-things`               | added as-is                                                | inquisitive                                              |
| [x]  | `leveraging-risk`                   | added as-is                                                | risk-taking                                              |
| [x]  | `lies-and-trickery`                 | merged → `deception`                                       | clever, stealthy                                         |
| [x]  | `might-defense`                     | added as-is                                                | hardy, resilient, tough                                  |
| [x]  | `mind-influencing-abilities`        | added as-is                                                | charming                                                 |
| [x]  | `noticing-small-details`            | added as-is                                                | perceptive                                               |
| [x]  | `physical-performing-arts`          | added as-is                                                | graceful                                                 |
| [x]  | `pleasant-social-interactions`      | added as-is                                                | appealing, beneficent, charming, honorable, jovial, kind |
| [x]  | `puzzle-solving`                    | added as-is                                                | creative, jovial                                         |
| [x]  | `remembering-experienced-events`    | added as-is                                                | intelligent                                              |
| [x]  | `repairing-and-crafting-machines`   | added as-is                                                | mechanical                                               |
| [x]  | `research`                          | added as-is                                                | creative                                                 |
| [x]  | `resisting-interrogation`           | added as-is                                                | mysterious                                               |
| [x]  | `resisting-mental-effects`          | added as-is                                                | strong-willed                                            |
| [x]  | `running`                           | added as-is                                                | craven, fast, swift                                      |
| [x]  | `sanity-defense`                    | added as-is                                                | doomed                                                   |
| [x]  | `seeing-through-tricks`             | added as-is                                                | skeptical                                                |
| [x]  | `sensing-emotions`                  | added as-is                                                | empathic                                                 |
| [x]  | `sneaking`                          | added as-is                                                | exiled                                                   |
| [x]  | `social-interaction`                | added as-is                                                | empathic                                                 |
| [x]  | `speed-defense`                     | added as-is                                                | doomed, graceful, impulsive                              |
| [x]  | `stealth`                           | added as-is                                                | craven, dishonorable, mysterious, stealthy               |
| [x]  | `supernatural-knowledge`            | added as-is                                                | weird                                                    |
| [x]  | `tracking`                          | added as-is                                                | vicious                                                  |
| [x]  | `understanding-machines`            | added as-is                                                | mechanical                                               |
| [x]  | `understanding-the-supernatural`    | added as-is                                                | mystical                                                 |
