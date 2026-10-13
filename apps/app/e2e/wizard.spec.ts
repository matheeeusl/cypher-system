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
    page.once('dialog', (dialog) => void dialog.accept())
    await page.getByRole('button', { name: t.delete }).click()
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
