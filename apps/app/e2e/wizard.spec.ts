import { expect, test } from '@playwright/test'

// Requires graphql-api running separately (pnpm dev:api) — see
// playwright.config.ts and apps/app/CLAUDE.md.

// Both walkthroughs create and delete the same user's character, so they must
// not run side by side.
test.describe.configure({ mode: 'serial' })

const copy = {
  en: {
    typeTitle: 'Choose Your Type',
    warrior: /Warrior/,
    edgeSection: 'Starting Edge',
    mightEdge: /Might \+1/,
    next: 'Next →',
    descriptorTitle: 'Choose Your Descriptor',
    descriptorSearch: /Search \d+ descriptors…/,
    descriptor: 'Brash',
    poolBonus: 'Pool bonus',
    focusTitle: 'Choose Your Focus',
    focusSearch: /Search \d+ foci…/,
    focus: 'Bears a Halo of Fire',
    sentence: 'I am a Brash Warrior who bears a Halo of Fire.',
    poolsMustSum: /must add up to exactly 6/,
    poolsTitle: 'Allocate Stat Pools',
    pointsRemaining: 'Points remaining',
    skillsTitle: 'Choose Trained Skills',
    autoTrained: 'Trained automatically by Brash',
    abilitiesTitle: 'Choose Tier-1 Abilities',
    fourSelected: '4 / 4 selected',
    effort: /Effort \d/,
    might: /Might \d/,
    namePlaceholder: 'e.g. Kessa Verne',
    reviewTitle: 'Review Your Character',
    save: 'Save Character',
    headline: 'Brash Warrior',
    exportPdf: 'Export as PDF',
    edit: 'Edit',
    toSheet: '← Character sheet',
    toList: '← My Characters',
    delete: 'Delete',
    cancel: 'Cancel',
    empty: 'No characters yet.',
  },
  'pt-br': {
    typeTitle: 'Escolha seu Tipo',
    warrior: /Guerreiro/,
    edgeSection: 'Margem inicial',
    mightEdge: /Força \+1/,
    next: 'Próximo →',
    descriptorTitle: 'Escolha seu Descritor',
    descriptorSearch: /Buscar entre \d+ descritores…/,
    descriptor: 'Atrevido',
    poolBonus: 'Bônus de Reserva',
    focusTitle: 'Escolha seu Foco',
    focusSearch: /Buscar entre \d+ focos…/,
    focus: 'Carrega uma Auréola de Fogo',
    sentence: 'Eu sou um(a) Atrevido Guerreiro que carrega uma Auréola de Fogo.',
    poolsMustSum: /devem somar exatamente 6/,
    poolsTitle: 'Distribua as Reservas',
    pointsRemaining: 'Pontos restantes',
    skillsTitle: 'Escolha as Perícias Treinadas',
    autoTrained: 'Treinadas automaticamente por Atrevido',
    abilitiesTitle: 'Escolha as Habilidades de Grau 1',
    fourSelected: '4 / 4 selecionadas',
    effort: /Esforço \d/,
    might: /Força \d/,
    namePlaceholder: 'ex.: Kessa Verne',
    reviewTitle: 'Revise seu Personagem',
    save: 'Salvar Personagem',
    headline: 'Atrevido Guerreiro',
    exportPdf: 'Exportar como PDF',
    edit: 'Editar',
    toSheet: '← Ficha do personagem',
    toList: '← Meus Personagens',
    delete: 'Excluir',
    cancel: 'Cancelar',
    empty: 'Nenhum personagem ainda.',
  },
} as const

for (const locale of ['en', 'pt-br'] as const) {
  const t = copy[locale]

  test(`[${locale}] walks the whole wizard, saves the character, reopens it and deletes it`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/characters/new`)
    await expect(page.locator('html')).toHaveAttribute('lang', locale === 'en' ? 'en' : 'pt-BR')

    // Type
    await expect(page.getByRole('heading', { name: t.typeTitle })).toBeVisible()
    await page.getByRole('button', { name: t.warrior }).click()
    await expect(page.getByText(t.edgeSection)).toBeVisible()
    await page.getByRole('button', { name: t.mightEdge }).click()
    await page.getByRole('button', { name: t.next }).click()

    // Descriptor
    await expect(page.getByRole('heading', { name: t.descriptorTitle })).toBeVisible()
    await page.getByPlaceholder(t.descriptorSearch).fill(t.descriptor)
    await page.getByRole('button', { name: t.descriptor }).click()
    await expect(page.getByText(t.poolBonus)).toBeVisible()
    await page.getByRole('button', { name: t.next }).click()

    // Focus
    await expect(page.getByRole('heading', { name: t.focusTitle })).toBeVisible()
    await page.getByPlaceholder(t.focusSearch).fill(t.focus)
    await page.getByRole('button', { name: t.focus }).click()

    // The fill-in-the-blank sentence reflects all three picks
    await expect(page.getByText(t.sentence)).toBeVisible()

    // Live validation kicks in as soon as Type/Descriptor/Focus are all set —
    // Pools/Abilities aren't finished yet, so it surfaces a real engine error
    // (localized from the engine's error code) rather than numbers.
    await expect(page.getByText(t.poolsMustSum)).toBeVisible()
    await page.getByRole('button', { name: t.next }).click()

    // Pools — allocate all 6 points
    await expect(page.getByRole('heading', { name: t.poolsTitle })).toBeVisible()
    const plusButtons = page.locator('button:has-text("+")')
    for (let i = 0; i < 2; i++) await plusButtons.nth(0).click()
    for (let i = 0; i < 2; i++) await plusButtons.nth(1).click()
    for (let i = 0; i < 2; i++) await plusButtons.nth(2).click()
    await expect(page.getByText(t.pointsRemaining)).toBeVisible()
    await page.getByRole('button', { name: t.next }).click()

    // Skills — Brash auto-trains Initiative and offers no further choices
    await expect(page.getByRole('heading', { name: t.skillsTitle })).toBeVisible()
    await expect(page.getByText(t.autoTrained)).toBeVisible()
    await page.getByRole('button', { name: t.next }).click()

    // Abilities — choose the 4 required tier-1 Type abilities
    await expect(page.getByRole('heading', { name: t.abilitiesTitle })).toBeVisible()
    const abilityButtons = page.locator('div.flex.max-h-\\[340px\\] button')
    await expect(abilityButtons.first()).toBeVisible()
    for (let i = 0; i < 4; i++) await abilityButtons.nth(i).click()
    await expect(page.getByText(t.fourSelected)).toBeVisible()

    // Now everything required is chosen — the live-validation panel should
    // show real derived numbers instead of an error.
    await expect(page.getByText(t.effort)).toBeVisible()
    await expect(page.getByText(t.might).first()).toBeVisible()

    // Equipment is fixed by the Type; Background needs a name
    await page.getByRole('button', { name: t.next }).click()
    await page.getByRole('button', { name: t.next }).click()
    await page.getByPlaceholder(t.namePlaceholder).fill('E2E Hero')
    await page.getByRole('button', { name: t.next }).click()

    // Review -> Save lands on the new character's sheet
    await expect(page.getByRole('heading', { name: t.reviewTitle })).toBeVisible()
    await page.getByRole('button', { name: t.save }).click()
    await expect(page.getByRole('heading', { name: 'E2E Hero' })).toBeVisible()
    await expect(page.getByText(t.headline)).toBeVisible()
    await expect(page.getByRole('button', { name: t.exportPdf })).toBeVisible()

    // Edit reopens the wizard on its Review step; the way back is the sheet
    await page.getByRole('link', { name: t.edit }).click()
    await expect(page.getByRole('heading', { name: t.reviewTitle })).toBeVisible()
    await page.getByRole('link', { name: t.toSheet }).click()
    await expect(page.getByRole('heading', { name: 'E2E Hero' })).toBeVisible()

    // The list card opens the sheet too; delete (confirm dialog) empties the list
    await page.getByRole('link', { name: t.toList }).click()
    const card = page.getByRole('link', { name: /E2E Hero/ })
    await expect(card).toContainText(t.headline)
    await card.click()
    await expect(page.getByRole('heading', { name: 'E2E Hero' })).toBeVisible()
    await page.getByRole('link', { name: t.toList }).click()
    await page.getByRole('button', { name: t.delete }).click()
    // A modal dialog (not window.confirm) asks first; cancelling keeps the card
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('E2E Hero')
    await dialog.getByRole('button', { name: t.cancel }).click()
    await expect(card).toBeVisible()
    await page.getByRole('button', { name: t.delete }).click()
    await dialog.getByRole('button', { name: t.delete }).click()
    await expect(page.getByText(t.empty)).toBeVisible()
  })
}

test('switching language mid-wizard keeps the unsaved progress', async ({ page }) => {
  await page.goto('/en/characters/new')
  await page.getByRole('button', { name: /Warrior/ }).click()
  await expect(page.getByText('Starting Edge')).toBeVisible()

  await page.getByRole('link', { name: 'PT-BR' }).click()

  // Same character-in-progress, now in Portuguese
  await expect(page.getByRole('heading', { name: 'Escolha seu Tipo' })).toBeVisible()
  await expect(page.getByText('Margem inicial')).toBeVisible()
  await expect(page.getByText('Eu sou um(a) adjetivo Guerreiro que verbo.')).toBeVisible()
})

// A Warrior with the Stealth flavor takes Goad (a Stealth tier-1 ability the
// Warrior doesn't have) among their four, saves, and sees it on the sheet.
const flavorCopy = {
  en: {
    flavorName: 'Stealth',
    none: 'None',
    goad: 'Goad',
    badge: 'Flavor: Stealth',
    threeSelected: '3 / 4 selected',
    sheetFlavor: 'Flavor: Stealth',
    fromFlavor: 'Flavor',
  },
  'pt-br': {
    flavorName: 'Furtividade',
    none: 'Nenhum',
    goad: 'Provocar',
    badge: 'Traço: Furtividade',
    threeSelected: '3 / 4 selecionadas',
    sheetFlavor: 'Traço: Furtividade',
    fromFlavor: 'Traço',
  },
} as const

for (const locale of ['en', 'pt-br'] as const) {
  const t = copy[locale]
  const f = flavorCopy[locale]

  test(`[${locale}] a flavor ability can be picked, saved and shown on the sheet`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/characters/new`)
    await page.getByRole('button', { name: t.warrior }).click()
    await page.getByRole('button', { name: t.mightEdge }).click()
    await page.getByRole('button', { name: t.next }).click()
    await page.getByPlaceholder(t.descriptorSearch).fill(t.descriptor)
    await page.getByRole('button', { name: t.descriptor }).click()
    await page.getByRole('button', { name: t.next }).click()
    await page.getByPlaceholder(t.focusSearch).fill(t.focus)
    await page.getByRole('button', { name: t.focus }).click()
    await page.getByRole('button', { name: t.next }).click()
    const plusButtons = page.locator('button:has-text("+")')
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) await plusButtons.nth(i).click()
    await page.getByRole('button', { name: t.next }).click()
    await page.getByRole('button', { name: t.next }).click()

    // Abilities: without a flavor Goad isn't offered
    await expect(page.getByRole('heading', { name: t.abilitiesTitle })).toBeVisible()
    const list = page.locator('div.flex.max-h-\\[340px\\]')
    await expect(list.locator('button').first()).toBeVisible()
    await expect(list.getByText(f.goad, { exact: true })).toHaveCount(0)

    // Choosing the flavor adds its abilities, badged, to the same list
    await page.getByRole('button', { name: f.flavorName, exact: true }).click()
    await expect(list.getByText(f.badge).first()).toBeVisible()
    await list.getByRole('button', { name: new RegExp(f.goad) }).click()
    for (let i = 0; i < 3; i++) await list.locator('button').nth(i).click()
    await expect(page.getByText(t.fourSelected)).toBeVisible()
    await expect(page.getByText(t.effort)).toBeVisible()

    // Dropping the flavor drops the ability that came from it, and only that
    await page.getByRole('button', { name: f.none, exact: true }).click()
    await expect(page.getByText(f.threeSelected)).toBeVisible()
    await page.getByRole('button', { name: f.flavorName, exact: true }).click()
    await list.getByRole('button', { name: new RegExp(f.goad) }).click()
    await expect(page.getByText(t.fourSelected)).toBeVisible()

    // Equipment, name, review (the flavor has its own row), save
    await page.getByRole('button', { name: t.next }).click()
    await page.getByRole('button', { name: t.next }).click()
    await page.getByPlaceholder(t.namePlaceholder).fill('E2E Flavored')
    await page.getByRole('button', { name: t.next }).click()
    await expect(page.getByRole('heading', { name: t.reviewTitle })).toBeVisible()
    await expect(page.getByText(f.flavorName, { exact: true })).toBeVisible()
    await page.getByRole('button', { name: t.save }).click()

    // The sheet names the flavor and labels Goad as coming from it
    await expect(page.getByRole('heading', { name: 'E2E Flavored' })).toBeVisible()
    await expect(page.getByText(f.sheetFlavor).first()).toBeVisible()
    await expect(
      page.getByText(new RegExp(`${f.goad}[\\s\\S]*${f.fromFlavor}`)).first(),
    ).toBeVisible()

    // Reopening for edit keeps the flavor; then delete the character
    await page.getByRole('link', { name: t.edit }).click()
    await expect(page.getByRole('heading', { name: t.reviewTitle })).toBeVisible()
    await expect(page.getByText(f.flavorName, { exact: true })).toBeVisible()
    await page.getByRole('link', { name: t.toSheet }).click()
    await page.getByRole('link', { name: t.toList }).click()
    await page.getByRole('button', { name: t.delete }).click()
    await page.getByRole('dialog').getByRole('button', { name: t.delete }).click()
    await expect(page.getByText(t.empty)).toBeVisible()
  })
}

// Blessing of the Gods (Magic flavor, tier 1) is one pick that asks for two more
// abilities: the wizard shows a picker for them and won't go on until it's done.
const blessingCopy = {
  en: {
    flavorName: 'Magic',
    blessing: 'Blessing of the Gods',
    heading: /Blessing of the Gods — choose 2 abilities \(0 \/ 2 selected\)/,
    war: 'War',
    sky: 'Sky/Air',
    need: 'Choose the abilities each of your chosen abilities asks for.',
    fromFlavor: 'Flavor',
  },
  'pt-br': {
    flavorName: 'Magia',
    blessing: 'Bênção dos Deuses',
    heading: /Bênção dos Deuses — escolha 2 habilidades \(0 \/ 2 selecionadas\)/,
    war: 'Guerra',
    sky: 'Céu/Ar',
    need: 'Escolha as habilidades que cada uma das suas habilidades escolhidas pede.',
    fromFlavor: 'Traço',
  },
} as const

for (const locale of ['en', 'pt-br'] as const) {
  const t = copy[locale]
  const b = blessingCopy[locale]

  test(`[${locale}] a choice ability asks for its picks, which end up on the sheet`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/characters/new`)
    await page.getByRole('button', { name: t.warrior }).click()
    await page.getByRole('button', { name: t.mightEdge }).click()
    await page.getByRole('button', { name: t.next }).click()
    await page.getByPlaceholder(t.descriptorSearch).fill(t.descriptor)
    await page.getByRole('button', { name: t.descriptor }).click()
    await page.getByRole('button', { name: t.next }).click()
    await page.getByPlaceholder(t.focusSearch).fill(t.focus)
    await page.getByRole('button', { name: t.focus }).click()
    await page.getByRole('button', { name: t.next }).click()
    const plusButtons = page.locator('button:has-text("+")')
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) await plusButtons.nth(i).click()
    await page.getByRole('button', { name: t.next }).click()
    await page.getByRole('button', { name: t.next }).click()

    // The Magic flavor offers the blessing; picking it opens the sub-picker
    await expect(page.getByRole('heading', { name: t.abilitiesTitle })).toBeVisible()
    await page.getByRole('button', { name: b.flavorName, exact: true }).click()
    const list = page.locator('div.flex.max-h-\\[340px\\]')
    await list.getByRole('button', { name: new RegExp(b.blessing) }).click()
    for (let i = 0; i < 3; i++) {
      await list.locator('button:not([class*="border-accent"])').first().click()
    }
    await expect(page.getByText(t.fourSelected)).toBeVisible()
    await expect(page.getByText(b.heading)).toBeVisible()

    // Four abilities are chosen but the blessings aren't: Next explains why
    await page.getByRole('button', { name: t.next }).click()
    await expect(page.getByText(b.need)).toBeVisible()

    const picker = page.locator('div.border.rounded', {
      hasText: new RegExp(`${b.blessing} — `),
    })
    await picker.getByRole('button', { name: b.war, exact: true }).click()
    await picker.getByRole('button', { name: b.sky, exact: true }).click()
    await page.getByRole('button', { name: t.next }).click()
    await page.getByRole('button', { name: t.next }).click()
    await page.getByPlaceholder(t.namePlaceholder).fill('E2E Blessed')
    await page.getByRole('button', { name: t.next }).click()
    await expect(page.getByRole('heading', { name: t.reviewTitle })).toBeVisible()
    await expect(page.getByText(new RegExp(`${b.war}.*${b.sky}|${b.sky}.*${b.war}`))).toBeVisible()
    await page.getByRole('button', { name: t.save }).click()

    // Both blessings are abilities of the saved character, credited to the flavor
    await expect(page.getByRole('heading', { name: 'E2E Blessed' })).toBeVisible()
    await expect(
      page.getByText(new RegExp(`${b.war}[\\s\\S]*${b.fromFlavor}`)).first(),
    ).toBeVisible()
    await expect(
      page.getByText(new RegExp(`${b.sky}[\\s\\S]*${b.fromFlavor}`)).first(),
    ).toBeVisible()

    await page.getByRole('link', { name: t.toList }).click()
    await page.getByRole('button', { name: t.delete }).click()
    await page.getByRole('dialog').getByRole('button', { name: t.delete }).click()
    await expect(page.getByText(t.empty)).toBeVisible()
  })
}
