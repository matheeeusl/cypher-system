---
name: cypher-pt-br-translation
description: Translates English content into Brazilian Portuguese (pt-BR) for the Cypher Project (bilingual Cypher System RPG reference site and character builder) — rules content (Types, Descriptors, Foci, Abilities, Cyphers, Artifacts, Oddities, damage track, recovery rolls) AND app/site UI copy (labels, buttons, messages, page text). Use this skill whenever translating any content into pt-BR for this project, reviewing or auditing existing pt-BR content for terminology consistency, or deciding what a Cypher System term should be called in Portuguese. Enforces a fixed glossary of official/attested Cypher System terms and requires flagging any term with no confirmed pt-BR translation instead of guessing — do not translate rules or UI content for this project without consulting this skill first.
---

# Cypher Project — PT-BR Translation

Translates English content (rules text and UI copy) into Brazilian Portuguese for the bilingual Cypher System reference site and character builder. Follows the project's verification-first working style: **confirm terminology before using it, flag what isn't confirmed, never invent an official-sounding term.**

## Core principle: glossary first, always

This project translates Cypher System terms **fully into Portuguese equivalents** (not "keep in English" — see `references/glossary.md` for the confirmed list: Tipo, Descritor, Foco, Esforço, Reserva, Grau, etc.).

Before translating any content:

1. **Check `references/glossary.md` first** for every game term in the source text (mechanical nouns: Type, Focus, Pool, Tier, Effort, Edge, damage-track states, etc.).
2. **Use the confirmed translation exactly as listed** — don't vary it, even if a synonym reads more naturally. Consistency across ~230+ Abilities and 141 Foci matters more than elegance on any single line.
3. **If a term appears in the source text but is NOT in the glossary** (confirmed or unconfirmed section), stop and flag it — do not guess a translation. Add it to the glossary's "needs confirmation" table with the English term, the English source sentence, and your best-guess candidate(s) marked clearly as unconfirmed. This mirrors the project's existing rule: flag ambiguity, don't fabricate (see `ways-of-working`).
4. Terms already in the glossary's "needs confirmation" section should stay flagged — do not promote them to confirmed on your own judgment; that requires Matheus's decision (ideally checked against the official pt-BR Cypher System Rulebook / Numenera translations, published by New Order Editora in Brazil).

## Two content types, two registers

### 1. Rules content (Types, Descriptors, Foci, Abilities, Cyphers, Artifacts, Oddities, flavor text)

- Source of truth for meaning is always the English rulebook PDF in this project — verify what a term/ability actually does in English before translating it, the same way the project verifies before modeling schema.
- Register: clear, rules-precise, second person ("você") — matches how the existing PT-BR content on the site reads. Avoid overly literary phrasing that obscures the mechanical meaning.
- Keep numbers, dice notation (d20, d6...), and stat abbreviations unchanged.
- Ability/Focus/Descriptor **names** get a Portuguese translation too (these appear in `/pt-br/` docs routes) — translate the name, don't leave it in English, but keep it short enough to work as a heading/label.
- Preserve the character-creation sentence structure: "Eu sou um(a) [Descritor] [Tipo] que [Foco]" — mirrors "I am a [Descriptor] [Type] who [Focus]" (see project overview). Note gender agreement (`um`/`uma`) is something English doesn't need — flag when a Descriptor/Type name makes the Portuguese article ambiguous or awkward, don't just pick one silently.

### 2. UI copy (buttons, labels, form fields, error/empty states, nav)

- Register: concise, direct, consistent with standard Brazilian Portuguese software UI conventions (e.g. "Salvar", "Cancelar", "Criar personagem" — imperative/infinitive for actions, not "Você deveria salvar").
- Game terms inside UI copy (e.g. a button labeled "Add Cypher") still follow the same glossary — "Adicionar Cifra", not "Adicionar Cypher".
- Keep UI strings short — Portuguese tends to run longer than English; flag when a translated string is likely to break a fixed-width UI element (buttons, nav labels, badges) instead of silently truncating meaning.

## i18n structure

Both locales are explicitly URL-prefixed (`/en/`, `/pt-br/`) across the Astro docs site and the Next.js character builder. When translating:

- Mirror the English content's file/route structure exactly under the `/pt-br/` equivalent — same frontmatter fields, same slugs pattern (translate the slug too, if the project's convention is to localize slugs — confirm this against an existing `/pt-br/` page before assuming).
- Don't invent new frontmatter fields or restructure content while translating; a translation pass changes language, not structure or schema. If the source content's structure seems wrong, flag it separately rather than fixing it silently mid-translation.

## Workflow

1. Identify what's being translated (rules content vs UI copy) and locate the English source (PDF for rules ground truth, or the existing English file/string for UI).
2. Pull every game term out of the source and check each against `references/glossary.md`.
3. If any term is unconfirmed or missing, stop and flag it before producing a final translation — present the flagged terms to Matheus, do not proceed past them silently.
4. Translate, applying the register rules above.
5. Do a consistency pass: does this reuse existing translations already used elsewhere on the site for the same term? (e.g., don't introduce a second Portuguese name for "Might" if "Potência" is already used elsewhere.)
6. Present the translation with the flagged/unconfirmed terms called out separately, so Matheus can confirm or correct before it's committed.

## Reference

- `references/glossary.md` — confirmed Cypher System term glossary (sourced from the official pt-BR Cypher System Rulebook / New Order Editora materials where available) plus a "needs confirmation" list of terms not yet verified.
