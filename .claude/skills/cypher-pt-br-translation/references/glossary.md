# Cypher System EN → PT-BR Glossary

Sources for the "confirmed" table: official pt-BR Cypher System Rulebook text and character-sheet translations circulating from New Order Editora's Numenera/Cypher System pt-BR line, cross-checked across multiple independent sheets/scans found via web search on 2026-09-22. Treat these as strong (not certified-canonical) — spot-check against the official book if Matheus has a physical/PDF copy.

## Confirmed terms

| English | Portuguese (pt-BR) | Notes |
|---|---|---|
| Type | Tipo | |
| Descriptor | Descritor | |
| Focus | Foco | |
| "I am a [Descriptor] [Type] who [Focus]" | "Eu sou um(a) [Descritor] [Tipo] que [Foco]" | Watch gender agreement per Descriptor/Type name |
| Effort | Esforço | |
| Edge | Margem | Confirmed by Matheus, 2026-09-22 |
| Pool | Reserva | Confirmed by Matheus, 2026-09-22 |
| Might | Força | Pool/stat name — confirmed by Matheus, 2026-09-22 (overrides earlier informal-source guess of "Potência" — do not use "Potência" for Might). "Vigor" had also drifted in as a second, uncanonical rendering across several already-shipped chapters/abilities before this was re-confirmed 2026-09-22; swept and fixed — don't use "Vigor" for Might either (ordinary-word uses of "vigor"/"vigorosa", unrelated to the stat, were left alone) |
| Speed | Velocidade | Pool/stat name |
| Intellect | Intelecto | Pool/stat name |
| Tier | Grau | Checked against Level below for conflict, 2026-09-22 — kept as Grau precisely because Level already owns "Nível" (105+ existing occurrences: creature level, cypher/artifact level, "nível de Esforço", etc.) and the two concepts co-occur in the same sentences often enough that merging them would be ambiguous |
| Level (creature level, cypher/artifact level, "level of Effort") | Nível | Pre-existing, extremely well-established (105+ occurrences) — do not repurpose for Tier |
| XP | XP | Unchanged |
| Cypher(s) | Cifra(s) | |
| Artifact(s) | Artefato(s) | Confirmed by Matheus, 2026-09-22 — moved from "needs confirmation"; was already the de facto term across the whole site/content anyway |
| Oddity/Oddities | Singularidade(s) | Confirmed by Matheus, 2026-09-22 |
| Ability | Habilidade | Confirmed by Matheus, 2026-09-22 — distinct from Special Ability |
| Special Ability/Abilities | Habilidade Especial / Habilidades Especiais | Confirmed by Matheus, 2026-09-22 |
| Difficulty | Dificuldade | Confirmed by Matheus, 2026-09-22 |
| GM Intrusion | Intrusão do Mestre | Confirmed by Matheus, 2026-09-22 — already in use this way in apps/docs |
| Flavor (Chapter 7 system) | Perfil | Confirmed by Matheus, 2026-09-22 |
| Action (action-type label) | Ação | Confirmed by Matheus, 2026-09-22 |
| Damage track | Marcador de Dano | Confirmed by Matheus, 2026-09-22 — "Trilha de Dano" had already spread into shipped pt-br content (apps/docs and several @cypher/content abilities) before this was pinned down; swept and fixed |
| Impaired | Enfraquecido | Damage track state |
| Debilitated | Debilitado | Damage track state |
| Recovery roll | Rolagem de Recuperação | |
| Skill(s) | Perícia(s) | |
| Trained | Treinado | Skill level |
| Specialized | Especializado | Skill level |
| Equipment | Equipamento | |
| Attacks | Ataques | |
| Armor | Armadura | |
| Enabler (action-type tag) | Habilitador | Confirmed by Matheus, 2026-09-22 |
| Asset | Recurso | Confirmed by Matheus, 2026-09-22 |
| action_type (all 28 enum values: Action, Action to initiate, Action to enter or exit, etc.) | See `apps/docs/src/lib/ability-format.ts`'s `ACTION_TYPE_LABELS` | Confirmed by Matheus, 2026-09-22 — already fully translated there, one pt-BR label per enum value, all following the "Ação" / "Ação para X" pattern. Not stored in `@cypher/content` YAML (it's a UI-display label, not rulebook prose — see that file's own header comment), so it needs no per-entity translation pass; just reuse the existing labels rather than retranslating inline. |

## Needs confirmation (do not use silently — flag when encountered)

Nothing outstanding right now. When a new term comes up in the source PDF with no confirmed pt-BR rendering, add a row here instead of picking one and moving on — surface it to Matheus, ideally checked against the physical/PDF Cypher System Rulebook (pt-BR) or Numenera pt-BR materials.

| English | Candidate(s) seen informally | Status |
|---|---|---|

## How to extend this glossary

When a new term gets confirmed (by Matheus, or against an official source):
1. Move it from "Needs confirmation" to "Confirmed terms".
2. Note the source in the Notes column if it's not the general rulebook (e.g. "confirmed by Matheus, 2026-XX-XX").
3. Keep this file as the single source of truth — don't let a second, informal glossary form elsewhere in the project.