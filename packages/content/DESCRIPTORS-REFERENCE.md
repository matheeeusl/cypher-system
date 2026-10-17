# Descriptors — source reference

Source: `rulebook/cypherrules.pdf` = **Old Gus' Unofficial Cypher System Player's Guide (OG-CSPG, 2025-09-17)**, Chapter 3 "Descriptor", pp. 29–103 (PDF page = printed page). Raw text: [`rulebook/descriptors-extract.txt`](../../rulebook/descriptors-extract.txt) (pdf.js extraction of pp. 28–103 plus p. 134 and p. 409; use it for wording, but re-check the PDF on anything that looks garbled — see §5).

The chapter has **103 descriptors**: 50 standard (genre-agnostic) + 53 genre descriptors in 8 groups. The genre groups are the second half of the table of contents (PDF p. 5). Since 2026-10-16 `data/descriptors/` holds all 103 (see [`GENRE-DESCRIPTORS-PLAN.md`](./GENRE-DESCRIPTORS-PLAN.md) phase 3); the API serves them, but the docs grouping and the wizard's Pool choice are phases 4–6.

## 1. Standard descriptors (pp. 30–54): verified

All 50 files in `data/descriptors/` were checked against the PDF on 2026-10-16:

- Every English string (description, each characteristic's text, inabilities, additional equipment, all 4 connection options): 346 strings, **0 mismatches** (normalized for whitespace, curly quotes and dashes; a deliberately altered string was caught, so the check works).
- `pool_bonus` against the `+N/−N to your <stat> Pool` lines: all 50 match, including Clumsy (+2 Might, −2 Speed) and Foolish (−4 Intellect). Hideous (4 points to divide) and Lucky (Luck Pool) stay in `characteristics`, as the schema comment says.

The book prints "Benificent" (TOC, p. 30 heading) but "Beneficent" on p. 29; the repo uses `beneficent`.

## 2. Genre descriptors (pp. 55–103): in the repo since 2026-10-16

"Pool" lists the stat bonus as printed. "Fits schema?" flags what `DescriptorSchema` (`src/schemas/descriptor.ts`) cannot express today; §3 groups those gaps.

### Cyberpunk (p. 55): "settings where humans augment their capabilities with … cyberware"

| Descriptor | Page | Pool                      | Notable / fits schema?                                                                                                                                              |
| ---------- | ---- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Addicted   | 55   | 2 pts divided Might/Speed | divide-points pool; **choose 2 skills from a fixed list of 9**; Addiction; All for Me (keep both intrusion XP); drug dose equipment                                 |
| Corpo      | 56   | +2 Intellect              | 4 trainings (positive social, intimidation, bureaucracy/corporate business, resisting persuasion); Self-serving; +$250; sidebar: pick a megacorp                    |
| Engram     | 57   | +4 Intellect              | Speed defense; Inorganic Components (immune poison/disease, EMP affects you); Computer Memory                                                                       |
| Furious    | 58   | +2 Might, +2 Speed        | Time for Violence (reroll → SHITS intrusion); two inabilities **printed as "Ability:"** (book error); SHITS sidebar                                                 |
| Luddite    | 59   | 4 pts divided Might/Speed | divide-points; choose 2 knowledge + 2 physical skills; **Unchromed**: loses the descriptor on gaining cybernetics (also p. 134: can't take `~` cyberware abilities) |

### Fairy Tale (p. 60): "combine the idea of magic and mental health"

| Descriptor | Page | Pool               | Notable / fits schema?                                                                                                               |
| ---------- | ---- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Bewitched  | 60   | +4 Intellect       | Insight (free player intrusion per 10-h recovery); **missing from the TOC**                                                          |
| Changeling | 61   | +4 Intellect       | Face-taker (1 XP); **Changeable (2 Intellect points)**: costed ability inside a descriptor; Fragile (+1 dmg on failed Might defense) |
| Fragmented | 62   | +2 Intellect       | Adaptable (asset in a chosen interaction skill); 2 inabilities; journal                                                              |
| Frumious   | 62   | +2 Might, +2 Speed | Bandersnatch (extends ability range one band); near-duplicate of Furious                                                             |
| Haunted    | 63   | +4 Speed           | Prescient (refuse a GM intrusion free)                                                                                               |
| Lost       | 63   | none               | choose 3 knowledge skills; Curiouser / And Curiouser; 2 inabilities; broken compass                                                  |

### Fantasy Species (p. 64): "GMs may want dwarves and elves to be mechanically different"

| Descriptor | Page | Pool         | Notable / fits schema?                                                                                                                                                                        |
| ---------- | ---- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catfolk    | 64   | +4 Speed     | Bared Claws (light weapon, 4 dmg)                                                                                                                                                             |
| Dragonfolk | 64   | +2 Might     | **Dragonbreath (3 Might points)**, Action; +2 Armor vs chosen energy; Scaly +1 Armor                                                                                                          |
| Dwarf      | 65   | +2 Might     | **practiced** with axes (weapon proficiency, not training); Vulnerability (+1 dmg on failed Intellect defense); axe                                                                           |
| Elf        | 65   | +2 Speed     | **specialized** in perception; practiced with one bow; stealth trained (specialized in woodland); Fragile; Long-Lived                                                                         |
| Gnome      | 66   | +2 Intellect | 2 creative skills (choice); practiced with hammers; **Natural Affinity: choose 1 of Communication / Eyes Adjusted / Minor Illusion** (full text inline; all three exist in `data/abilities/`) |
| Half-Giant | 67   | +4 Might     | +1 dmg melee/thrown; Breaker (smashing eased); heavy weapon                                                                                                                                   |
| Halfling   | 67   | +2 Speed     | Advantage (+3 to an XP reroll)                                                                                                                                                                |
| Helborn    | 68   | +2 Intellect | Fire Adapted +2 Armor vs fire; **Helborn Magic: one low-tier ability, GM approval**; Inner Evil (see note below)                                                                              |
| Lizardfolk | 69   | +2 Speed     | practiced javelins/spears; Scaly +1 Armor; spear + 2 javelins                                                                                                                                 |

Helborn's text points to "Chapter 9: Abilities" of the Cypher System Rulebook / OG-CSRD, but OG-CSPG p. 449 ("Additional Special Abilities") names "a descriptor like helborn" as a source and lists **low-tier abilities on pp. 449–455** (mid-tier 455–459, high-tier 459–462).

### Modern Magic (p. 70): "characters who are or become significantly nonhuman"

Five of these have an **Advancement** list: "With the GM's approval, you can choose from these abilities instead of your type abilities" (Dragon also allows them "as an 'other' character advancement").

| Descriptor | Page  | Pool                        | Notable / fits schema?                                                                                                                   | Advancement options                                                                                                               |
| ---------- | ----- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Chimera    | 70    | +1 Might                    | Fur and Hide +1 Armor; For the Gang; Ham-fisted                                                                                          | Athlete, Dual Light Wield, Enhanced Might, Enhanced Speed, Fists of Fury, Frenzy                                                  |
| Dragon     | 71    | +2 Might                    | Dragon Form; Fireproof +2 Armor; **Wings (1 Might)**, Teeth, **Spitting Flames (1+ Might)**                                              | Danger Sense, Defensive Field, Enhanced Might, Enhanced Might Edge, Enlarge, "Training in Spitting Flames" (bare line)            |
| Ghost      | 72–73 | +2 Intellect                | Insubstantial (physical attacks hindered); Dead; Uniform; Calling the Dead                                                               | Duplicate, Question the Spirits, See the Unseen, Speaker for the Dead, Surprise Attack, Walk Through Walls                        |
| Hunter     | 73    | +2 Speed                    | Equestrian; Sword Hand (two-handed swords); 2 inability-like traits                                                                      | none                                                                                                                              |
| Nix        | 74    | none                        | Transformation; Unchillable +2 Armor vs cold; Sharp Teeth; Quick Swimming; Siren Song; Distractible                                      | Calm Stranger, Enhanced Speed, **Restful Presence** (no file in `data/abilities/`), Ruin Lore, Soothe the Savage, Wilderness Life |
| Sylph      | 75    | **+2 Intellect _or_ Speed** | **Sylph Flight (2 Intellect or Speed)**, **Oncoming Storm (1 Intellect)**; "Fragile" = Might defense hindered (≠ Elf/Changeling Fragile) | Enhanced Intellect, Enhanced Speed, Eyes Adjusted, Influence Swarm, Precision, Shock                                              |
| Unmagical  | 76    | +1 to each Pool             | resists magic; all magic actions hindered; Magical Failure (intrusion on 1–2); 2 sidebars                                                | none                                                                                                                              |

Every advancement ability except Restful Presence already has a file in `data/abilities/` (checked by id).

### Post-Apocalyptic (p. 77): "species affected by the disaster as well as general descriptors for human PCs"

| Descriptor | Page  | Pool                                                      | Notable / fits schema?                                                                                             |
| ---------- | ----- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Bitter     | 77    | +4 Intellect                                              | keepsake                                                                                                           |
| Canien     | 78    | +2 Might                                                  | Loyal; Bite (light weapon); Chewer                                                                                 |
| Felis      | 79    | +2 Intellect                                              | Darksight; Claws; Light on Your Paws; Jumpy; 2 inabilities                                                         |
| Flutter    | 80    | +2 Speed                                                  | Darksight; Fragile; **Erratic Flyer: Hover becomes selectable as a tier-1 type ability**                           |
| Hopeful    | 81    | +4 Intellect                                              | Shrug Off Disappointment (free Effort on retry)                                                                    |
| Mutant     | 81–89 | none                                                      | **everything is random**: pick a package, then roll d100 tables (§4)                                               |
| Morlock    | 90    | +2 Intellect; "+2 to your Might Pool and your Speed Pool" | Partially Metallic +1 Armor; Repair and Maintenance (repair roll before recovery); no skills                       |
| Roach      | 90    | **+1 Speed Edge** (Edge, not Pool)                        | Carapace +1 Armor; Cling; Glide; 2 inabilities + Insect Prejudice                                                  |
| Rusted     | 91    | **+2 Might _or_ +2 Intellect _or_ +1 all three**          | choose Might or Intellect defense; one creative skill; inability depends on the chosen injury; prosthetic/eyepatch |
| Shiny      | 92    | +2 Speed                                                  | Shiny Maneuver (ease a roll, intrusion range 1–3)                                                                  |

### Science Fiction Species (p. 93): "alien species or androids"

| Descriptor               | Page | Pool                                                      | Notable / fits schema?                                                                                                           |
| ------------------------ | ---- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Artificially Intelligent | 93   | +4 Intellect; "+3 to your Might Pool and your Speed Pool" | Shell +1 Armor; Limited Recovery; Mechanics, Not Medicines; Uncanny Valley (hindered **two steps**); **no Initial Link section** |
| Quintar                  | 93   | +4 Intellect                                              | one knowledge skill (choice); interactions with humans eased; Difficult Rest (−2 recovery); **no Initial Link section**          |

### Superhero (p. 94)

| Descriptor  | Page | Pool                           | Notable / fits schema?                                                                                  |
| ----------- | ---- | ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Amazing     | 94   | +2 Speed **+ 2 pts to divide** | Self-Hype (free Effort level)                                                                           |
| Incredible  | 94   | +2 Might **+ 2 pts to divide** | Incredible Action (auto-success ≤ 6 + intrusion); skill/skill/inability printed in one run-on paragraph |
| Mighty      | 95   | +4 Might                       | Healthy (+1 to recovery rolls); no inability                                                            |
| Sensational | 95   | **4 pts to divide**            | one career skill (choice); Popular                                                                      |
| Uncanny     | 96   | +2 Might, +2 Speed             | Distinctive Physical Quirk; A Sense for the Weird; perception **or** stealth (choice)                   |

### Weird West (p. 97)

| Descriptor    | Page   | Pool         | Notable / fits schema?                                                                                                    | Advancement options                                                                                               |
| ------------- | ------ | ------------ | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Forgeborn     | 97–98  | +4 Might     | Resistant (two assets vs daze/stun, immune poison/disease); Fixable; **missing from the p. 29 list**                      | Bash, Enhanced Might, Enhanced Might Edge, Enlarge, Nothing but Defend, "Training in Unarmed Attacks" (bare line) |
| Grizzled      | 98     | +2 Intellect | Try, Try Again (first retry needs no Effort); extra item (expensive or less)                                              | none                                                                                                              |
| Laconic       | 99     | +2 Intellect | 2 skills only, no inability                                                                                               | none                                                                                                              |
| Risen         | 99–100 | none         | Hell Hide +1 Armor; Deathless Resilience; Sometimes You Come Back (2 XP); Stiff as Death; **missing from the p. 29 list** | Absorb Kinetic Energy, Improved Recovery, Not Dead Yet, Repair Flesh, See the Unseen, Speaker for the Dead        |
| Slick         | 101    | +2 Intellect | expensive clothing                                                                                                        | none                                                                                                              |
| Trailblazing  | 101    | +2 Might     | hand compass                                                                                                              | none                                                                                                              |
| Trigger Happy | 102    | +2 Speed     | light or medium pistol; spelled "Trigger-Happy" on p. 29                                                                  | none                                                                                                              |
| Unforgiving   | 102    | +2 Might     | extra medium weapon; sidebar ties it to the Revenge character arc                                                         | none                                                                                                              |
| Wily          | 103    | +2 Intellect | Hunch (free Intellect Effort level); expensive item "another PC lost"                                                     | none                                                                                                              |

## 3. Where `DescriptorSchema` didn't fit the genre descriptors (resolved 2026-10-16)

The gaps found before the genre descriptors were added, each with how it was settled (decisions in [`GENRE-DESCRIPTORS-PLAN.md`](./GENRE-DESCRIPTORS-PLAN.md)). The rule: only what the engine must apply became structured data (the Pools, the category, skill notes); everything else stays prose in `characteristics`, which the docs and the wizard already display.

1. **`connection_options: length(4)`**: Artificially Intelligent and Quintar print no Initial Link at all. → The schema accepts 0 or 4; the docs page hides the section when there are none.
2. **`pool_bonus` = fixed stat + fixed amount.** Doesn't cover: points to divide (Addicted and Luddite between Might/Speed; Amazing, Incredible, Sensational among all), either/or choices (Sylph, Rusted), an **Edge** bonus (Roach), or a random result (Mutant). The precedent (Hideous, Lucky) is to keep such cases in `characteristics`. Unmagical's "+1 to each" fits as three entries; Morlock's and AI's "+N to your Might Pool and your Speed Pool" read as +N to each. → `pool_bonus_choice` (`divide` / `one-of`), applied and validated by the engine (`descriptor_pool_choice`); Hideous moved there too. Roach's Edge and Lucky's Luck Pool stay characteristics; Mutant's rolls are `data/reference-tables/mutant-mutations.yaml`.
3. **Armor**: about a dozen descriptors give +1 Armor or +2/+3 Armor against one damage type. No field exists. → Prose in `characteristics`.
4. **Costed abilities inside a descriptor** (Changeling's Changeable, Dragonfolk's Dragonbreath, Dragon's Wings and Spitting Flames, Sylph's Flight and Oncoming Storm). `characteristics` has no cost or action/enabler field. → Prose, with the cost in the characteristic's name ("Dragonbreath (3 Might points)").
5. **Ability choices**: Gnome's Natural Affinity (1 of 3 existing abilities), Helborn Magic (any low-tier ability, GM approval), Flutter's Erratic Flyer (adds Hover to the type's tier-1 pool). → Prose; the abilities they name exist in `data/abilities/` (see each file's leading comment).
6. **Skill levels and choices**: `skill_training` has no level, so it can't express "specialized" (Elf perception) or "practiced" weapon proficiency (Dwarf, Elf, Gnome, Lizardfolk, Hunter), nor "choose N from this list" (Addicted's 2 of 9). → `skill_training[].note` holds the rest of the line (shown in the docs); weapon proficiency stays a characteristic.
7. **Advancement lists** (Chimera, Dragon, Ghost, Nix, Sylph, Forgeborn, Risen): extra abilities that can replace type abilities with GM approval. This is the same "extra options in the type's pick pool" situation that [`FLAVORS-PLAN.md`](./FLAVORS-PLAN.md) §2 solved for flavors. → Prose ("Chimera Advancement"); making them real picks is open question 3 of the plan.
8. **Category**: there is no field for Standard / Cyberpunk / Fairy Tale / …, which the docs index would need for grouping. → `category` (default `standard`) plus `data/reference-tables/descriptor-categories.yaml` (names, intros, first page).
9. **Provenance**: like the flavors, these should say in a leading YAML comment that they come from the unofficial OG-CSPG. → Done in all 53 files.

## 4. Mutant tables (pp. 81–89)

Mutant has no fixed characteristics. The player picks one package, and its mutations are **rolled**, not chosen:

- 2 beneficial; or 3 beneficial + 1 harmful; or 1 powerful + 1 harmful; or 1 beneficial + 1 distinctive + 1 harmful.
- Optional: up to 4 distinctive mutations (3 under the "transitory mutations" optional rule, which this book doesn't define), and 1 or 2 cosmetic.

| Table       | Page(s) | Die  | Rows                     |
| ----------- | ------- | ---- | ------------------------ |
| Beneficial  | 82      | d100 | 24                       |
| Harmful     | 83      | d100 | 14                       |
| Powerful    | 83–85   | d100 | 27                       |
| Distinctive | 85–88   | d100 | 35                       |
| Cosmetic    | 88–89   | d100 | 86 (printed "COSTMETIC") |

Several distinctive rows say "Also roll on the Beneficial Mutations table." These belong in `data/reference-tables/`, the way the Focus Connections table is stored.

## 5. Book errors and extraction artifacts

- TOC (pp. 4–5) omits **Bewitched**; the p. 29 overview list omits **Forgeborn** and **Risen**. The chapter body has all three.
- "Benificent" vs "Beneficent"; "Trigger Happy" (heading) vs "Trigger-Happy" (p. 29); "COSTMETIC MUTATIONS" (p. 88).
- Furious labels both inabilities "Ability:".
- Ghost's Surprise Attack ends with a stray "(188)" page reference.
- Dragon's and Forgeborn's advancement lists end in a bare line ("Training in Spitting Flames", "Training in Unarmed Attacks") with no rules text.
- Corpo's equipment line is missing a word ("Your job has allowed you to a comfortable buffer…").
- Extraction only: the ENGRAM heading runs straight into its pull quote (`ENGRAM"But I thought…`), and Incredible's three lines are one paragraph.
- Same names with different effects: **Fragile** (Changeling/Elf/Flutter: +1 damage on a failed Might defense; Sylph: Might defense hindered). Agile, Scaly, Darksight, Exceptional and Crafty also repeat across descriptors. Don't merge them by name.

## 6. Descriptor rules outside Chapter 3

| Page | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 23   | Your descriptor guides how you use Intellect.                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 24   | Descriptor and type (and possibly focus) set starting Pools; descriptors can raise Pool **or Edge**.                                                                                                                                                                                                                                                                                                                                                                                     |
| 26   | Skills come from descriptor, type or focus; "a few descriptors provide training with defense tasks."                                                                                                                                                                                                                                                                                                                                                                                     |
| 28   | Character sentence: the descriptor is the adjective. The GM may limit descriptors to the setting; two PCs rarely need the same one. Pick descriptor and focus before type.                                                                                                                                                                                                                                                                                                               |
| 29   | You may pick any descriptor or the GM gives a list; a species can be a species descriptor or just a standard one (greyhound people → Fast); completing a character arc can earn a new descriptor.                                                                                                                                                                                                                                                                                        |
| 104  | Choose descriptor and focus first, then the type that completes the concept.                                                                                                                                                                                                                                                                                                                                                                                                             |
| 134  | Unchromed: a Luddite can't install cybernetics or gain `~` cyberware-derived abilities.                                                                                                                                                                                                                                                                                                                                                                                                  |
| 164  | Think about your focus in relation to your descriptor.                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 395  | A resolved character arc may change your descriptor, focus or flavor.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 409  | **Customizing Descriptors**: +4 to one Pool and two narrow skills or one broad skill; or +2 to one Pool and three narrow skills, or one narrow and one broad. An extra skill is allowed if balanced by an inability. A low-tier ability equals at least two narrow skills. Broad = many areas (all interaction); narrow = fewer (deception); combat skills are broad. **Two Descriptors** (GM option): a training from one and an inability in the same skill from the other cancel out. |
| 449  | Additional Special Abilities: "you might gain these abilities from a descriptor like helborn". Power grades: low tier 1–2, mid 3–4, high 5–6.                                                                                                                                                                                                                                                                                                                                            |
