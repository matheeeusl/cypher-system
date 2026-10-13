import { expect, test } from '@playwright/test'

// Requires graphql-api running separately (pnpm dev:api) — see
// playwright.config.ts and apps/app/CLAUDE.md.
test('walks the whole wizard, saves the character, reopens it and deletes it', async ({ page }) => {
  await page.goto('/en/characters/new')

  // Type
  await expect(page.getByRole('heading', { name: 'Choose Your Type' })).toBeVisible()
  await page.getByRole('button', { name: /Warrior/ }).click()
  await expect(page.getByText('Starting Edge')).toBeVisible()
  await page.getByRole('button', { name: /Might \+1/ }).click()
  await page.getByRole('button', { name: 'Next →' }).click()

  // Descriptor
  await expect(page.getByRole('heading', { name: 'Choose Your Descriptor' })).toBeVisible()
  await page.getByPlaceholder(/Search \d+ descriptors…/).fill('Brash')
  await page.getByRole('button', { name: 'Brash' }).click()
  await expect(page.getByText('Pool bonus')).toBeVisible()
  await page.getByRole('button', { name: 'Next →' }).click()

  // Focus
  await expect(page.getByRole('heading', { name: 'Choose Your Focus' })).toBeVisible()
  await page.getByPlaceholder(/Search \d+ foci…/).fill('Bears a Halo of Fire')
  await page.getByRole('button', { name: 'Bears a Halo of Fire' }).click()

  // The fill-in-the-blank sentence reflects all three picks
  await expect(page.getByText('I am a Brash Warrior who bears a Halo of Fire.')).toBeVisible()

  // Live validation kicks in as soon as Type/Descriptor/Focus are all set —
  // Pools/Abilities aren't finished yet, so it surfaces a real engine error
  // rather than numbers.
  await expect(page.getByText(/must sum to exactly 6/)).toBeVisible()
  await page.getByRole('button', { name: 'Next →' }).click()

  // Pools — allocate all 6 points
  await expect(page.getByRole('heading', { name: 'Allocate Stat Pools' })).toBeVisible()
  const plusButtons = page.locator('button:has-text("+")')
  for (let i = 0; i < 2; i++) await plusButtons.nth(0).click()
  for (let i = 0; i < 2; i++) await plusButtons.nth(1).click()
  for (let i = 0; i < 2; i++) await plusButtons.nth(2).click()
  await expect(page.getByText('Points remaining')).toBeVisible()
  await page.getByRole('button', { name: 'Next →' }).click()

  // Skills — Brash auto-trains Initiative and offers no further choices
  await expect(page.getByRole('heading', { name: 'Choose Trained Skills' })).toBeVisible()
  await expect(page.getByText('Trained automatically by Brash')).toBeVisible()
  await page.getByRole('button', { name: 'Next →' }).click()

  // Abilities — choose the 4 required tier-1 Type abilities
  await expect(page.getByRole('heading', { name: 'Choose Tier-1 Abilities' })).toBeVisible()
  const abilityButtons = page.locator('div.flex.max-h-\\[340px\\] button')
  await expect(abilityButtons.first()).toBeVisible()
  for (let i = 0; i < 4; i++) await abilityButtons.nth(i).click()
  await expect(page.getByText('4 / 4 selected')).toBeVisible()

  // Now everything required is chosen — the live-validation panel should
  // show real derived numbers instead of an error.
  await expect(page.getByText(/Effort \d/)).toBeVisible()
  await expect(page.getByText(/Might \d/)).toBeVisible()

  // Equipment is fixed by the Type; Background needs a name
  await page.getByRole('button', { name: 'Next →' }).click()
  await page.getByRole('button', { name: 'Next →' }).click()
  await page.getByPlaceholder('e.g. Kessa Verne').fill('E2E Hero')
  await page.getByRole('button', { name: 'Next →' }).click()

  // Review -> Save lands on My Characters with the new card
  await expect(page.getByRole('heading', { name: 'Review Your Character' })).toBeVisible()
  await page.getByRole('button', { name: 'Save Character' }).click()
  await expect(page).toHaveURL(/\/en$/)
  const card = page.getByRole('link', { name: /E2E Hero/ })
  await expect(card).toBeVisible()
  await expect(card).toContainText('Brash Warrior')

  // Opening it goes back to the wizard on its Review step
  await card.click()
  await expect(page.getByRole('heading', { name: 'Review Your Character' })).toBeVisible()
  await page.getByRole('link', { name: '← My Characters' }).click()

  // Delete (confirm dialog) returns to the empty state
  page.once('dialog', (dialog) => void dialog.accept())
  await page.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('No characters yet.')).toBeVisible()
})
