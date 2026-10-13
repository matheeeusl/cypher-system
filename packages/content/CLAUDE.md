# @cypher/content — rules data

YAML content, Zod schemas, and a loader for Cypher System rules data (Types, Descriptors, Foci, Abilities, Skills, Cyphers, Artifacts, Oddities).

No `Equipment` entity category — checked directly against the rulebook and confirmed there is no equipment catalog at all, no named individual items to list. The equipment system is entirely fixed, universal facts (3 weapon categories, 3 armor categories, 6 abstract price tiers), which live under `data/reference-tables/` instead — see "Conventions" below.

## Conventions

- **One file per entity, one entity per file.** Content lives at `data/<category>/<id>.yaml`, where `id` doubles as the filename (minus extension). `loadEntities()` in `loader.ts` reads every `.yaml` file in a category directory and keys the resulting map by each entity's own `id`.
- **Exception: `data/reference-tables/`.** Some rulebook content isn't an entity at all — it's a single flat table used identically by everything that points to it, rather than authored per-entity. Current examples: Focus Connections (every Focus shares the same d100 table rather than defining its own connection text) and the equipment system (weapon categories, armor categories, price tiers — fixed, universal facts, not named items to catalog per-entity). These live as one file per _table_, singular (`data/reference-tables/<table-name>.yaml` — not one file per row), loaded by a dedicated accessor rather than `loadEntities()`, and are **not** wrapped in `WithVersion`/`content_version`. Nothing snapshots against a reference table: a Focus Connection roll is narrative flavor a player picks, not a stat that a saved character locks in; weapon/armor/price-tier facts are universal constants no character "has a copy of" to begin with. Either way there's nothing to detect staleness against, so these skip the versioning treatment the entity categories get.
  Most reference tables are arrays (multiple rows), but `ammunition.yaml` is a single object — it's one fact (its price tier), not a category with multiple rows, so its schema and content shape reflect that rather than padding out a one-element array.

## Content accuracy

Content fields should hold real rulebook text, verified against the actual source — not paraphrased or invented to fill a schema shape. Where real text isn't available yet (a translation pass, a bulk-transcription table), leave it explicitly empty/placeholder rather than guessing, and flag the gap rather than silently filling it in.

### Cypher content: fully populated

`data/cyphers/` holds 166 entries — every cypher name from the rulebook's own Manifest, Fantastic, Subtle, and Power Boost tables, with `name`/`category` verified against those tables, plus `efficacy-boost-major`/`efficacy-boost-minor` split out from `efficacy-boost` once real data showed the Rulebook's major/minor pair is distinct from Claim the Sky's own single "efficacy boost" cypher (which kept the `efficacy-boost` id). Files were filled in one at a time by hand; while in progress, a cypher's `page_ref` field held the literal string `"PENDING"` until real `page_ref`/`level_range`/`effect_text`/`effect_table` data had been added for it. As of the last content pass (including `burst-of-speed`, the final holdout), no file has `page_ref === 'PENDING'` — verified with a directory-wide grep. All 166 are safe to treat as populated content in downstream consumers (graphql-api, apps/docs) and safe to pin in tests.

A handful of filled-in cyphers carry a leading YAML comment flagging real caveats worth knowing before trusting the data outright: `phase-changer`'s `level_range` is a community (OG-CSRD) editorial addition, not primary rulebook text; `mind-stabilizer`'s missing duration and the source's suggested house-rule fix; `force-field`'s note applies to the whole force wall/shield/cube family, not just that one cypher. Check a cypher's own file for a leading comment before treating its data as unconditionally authoritative.

### Skills: ids follow the Descriptor wording

`data/skills/` holds 74 entries (23 added for ability `skill_grant` options — nine attack-type skills `<light|medium|heavy>-<bashing|bladed|ranged>-attacks` (combat) plus: public-speaking, persuasion, crafting, computers, piloting, vehicle-driving, lockpicking, tinkering-with-devices, sensing-danger, navigation, riding, pickpocketing, sleight-of-hand, blazing). The rulebook has no definitive skill list, so a Skill's `id` mirrors the phrase a Descriptor uses ("pleasant social interactions", "might defense") rather than a fixed taxonomy — except where one id would bundle independent skills (split, e.g. Rugged now lists `climbing`, `jumping`, `running`, `swimming`) or two ids mean the same thing (merged). `SkillSchema` stays uncategorized on purpose, with one exception: an optional `combat: true` on the six fighting skills (the four defenses, resisting mental effects, initiative), which exists only so "choose noncombat skills" abilities (`skill_grant.options: noncombat`) can exclude them (the nine attack-type skills are flagged too); the restriction on "choose N skills" entries (Calm's "nonphysical", Learned's "areas of knowledge") is display text in the docs site, not data.

`src/test/loader.test.ts` fails if any `Descriptor.skill_training[].skill_id` or `Type.starting_skills` entry doesn't resolve to a Skill — the loader itself doesn't cross-check ids between categories. The `pt-BR` descriptions of those 23 skills are translated (2026-10-13). The decisions, the per-id outcomes, and the open optional follow-ups are in [`SKILLS-TRACKING.md`](./SKILLS-TRACKING.md).

### Abilities: the `attack` flag

`attack: true` marks the ~90 abilities that are themselves an attack (they make an attack roll or inflict damage: Bash, Bolts of Power, Spray…). The rulebook doesn't tag them, so the list was curated by hand from the action abilities whose text mentions attacks or damage. Buffs that only boost attacks (Fury, Deadly Aim), effects that restrain or summon, and enablers are left unflagged. It exists for the Skills advancement, which can only train an attack ability; if a legitimate attack is missing, add the flag to its yaml.

### Known gap: no cross-reference mechanism for shared rules terms

Some prose fields mention a rules concept that doesn't have its own entity/page yet — e.g. "the damage track" (`data/cyphers/death-bringer.yaml`'s `effect_text`, and the Warrior's Weapon Break player intrusion in `data/types/warrior.yaml`). There's no glossary/Rules entity category and no link syntax inside `LocalizedString` fields, so these stay plain prose with an inline YAML comment flagging the pending cross-reference. Revisit once apps/docs has a Rules/glossary page to actually link to — don't invent link structure for a single recurring term in the meantime.
