# @cypher/content — rules data

YAML content, Zod schemas, and a loader for Cypher System rules data (Types, Descriptors, Foci, Abilities, Skills, Cyphers, Artifacts, Oddities).

No `Equipment` entity category — checked directly against the rulebook and confirmed there is no equipment catalog at all, no named individual items to list. The equipment system is entirely fixed, universal facts (3 weapon categories, 3 armor categories, 6 abstract price tiers), which live under `content/reference-tables/` instead — see "Conventions" below.

## Conventions

- **One file per entity, one entity per file.** Content lives at `content/<category>/<id>.yaml`, where `id` doubles as the filename (minus extension). `loadEntities()` in `loader.ts` reads every `.yaml` file in a category directory and keys the resulting map by each entity's own `id`.
- **Exception: `content/reference-tables/`.** Some rulebook content isn't an entity at all — it's a single flat table used identically by everything that points to it, rather than authored per-entity. Current examples: Focus Connections (every Focus shares the same d100 table rather than defining its own connection text) and the equipment system (weapon categories, armor categories, price tiers — fixed, universal facts, not named items to catalog per-entity). These live as one file per *table*, singular (`content/reference-tables/<table-name>.yaml` — not one file per row), loaded by a dedicated accessor rather than `loadEntities()`, and are **not** wrapped in `WithVersion`/`content_version`. Nothing snapshots against a reference table: a Focus Connection roll is narrative flavor a player picks, not a stat that a saved character locks in; weapon/armor/price-tier facts are universal constants no character "has a copy of" to begin with. Either way there's nothing to detect staleness against, so these skip the versioning treatment the entity categories get.
  Most reference tables are arrays (multiple rows), but `ammunition.yaml` is a single object — it's one fact (its price tier), not a category with multiple rows, so its schema and content shape reflect that rather than padding out a one-element array.

## Content accuracy

Content fields should hold real rulebook text, verified against the actual source — not paraphrased or invented to fill a schema shape. Where real text isn't available yet (a translation pass, a bulk-transcription table), leave it explicitly empty/placeholder rather than guessing, and flag the gap rather than silently filling it in.

### Known gap: Cypher stubs pending real content

`content/cyphers/` holds 166 entries — every cypher name from the rulebook's own Manifest, Fantastic, Subtle, and Power Boost tables, with `name`/`category` verified against those tables, plus `efficacy-boost-major`/`efficacy-boost-minor` split out from `efficacy-boost` once real data showed the Rulebook's major/minor pair is distinct from Claim the Sky's own single "efficacy boost" cypher (which kept the `efficacy-boost` id). Files are filled in one at a time by hand; a cypher's `page_ref` field is the literal string `"PENDING"` until real `page_ref`/`level_range`/`effect_text`/`effect_table` data has been added. Don't treat a cypher as populated content in a downstream consumer (graphql-api, apps/docs) — or write a test that pins its values — while `page_ref === 'PENDING'`. As of the last content pass, only `burst-of-speed` is still pending.

A handful of filled-in cyphers carry a leading YAML comment flagging real caveats worth knowing before trusting the data outright: `phase-changer`'s `level_range` is a community (OG-CSRD) editorial addition, not primary rulebook text; `mind-stabilizer`'s missing duration and the source's suggested house-rule fix; `force-field`'s note applies to the whole force wall/shield/cube family, not just that one cypher. Check a cypher's own file for a leading comment before treating its data as unconditionally authoritative.

### Known gap: no cross-reference mechanism for shared rules terms

Some prose fields mention a rules concept that doesn't have its own entity/page yet — e.g. "the damage track" (`content/cyphers/death-bringer.yaml`'s `effect_text`, and the Warrior's Weapon Break player intrusion in `content/types/warrior.yaml`). There's no glossary/Rules entity category and no link syntax inside `LocalizedString` fields, so these stay plain prose with an inline YAML comment flagging the pending cross-reference. Revisit once apps/docs has a Rules/glossary page to actually link to — don't invent link structure for a single recurring term in the meantime.
