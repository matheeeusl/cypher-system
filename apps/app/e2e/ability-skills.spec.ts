import { expect, test } from '@playwright/test'

// Requires graphql-api running separately (pnpm dev:api) — see
// playwright.config.ts and apps/app/CLAUDE.md.

// Physical Skills trains two skills the player picks: the wizard must ask for
// them, block Next until they're chosen, and the saved character is trained.
test('a skill-granting ability asks for its skills and trains the character', async ({ page }) => {
  await page.goto('/en/characters/new')

  await page.getByRole('button', { name: /Warrior/ }).click()
  await page.getByRole('button', { name: /Might \+1/ }).click()
  await page.getByRole('button', { name: 'Next →' }).click()

  await page.getByPlaceholder(/Search \d+ descriptors…/).fill('Brash')
  await page.getByRole('button', { name: 'Brash' }).click()
  await page.getByRole('button', { name: 'Next →' }).click()

  await page.getByPlaceholder(/Search \d+ foci…/).fill('Bears a Halo of Fire')
  await page.getByRole('button', { name: 'Bears a Halo of Fire' }).click()
  await page.getByRole('button', { name: 'Next →' }).click()

  const plusButtons = page.locator('button:has-text("+")')
  for (let i = 0; i < 3; i++) for (let n = 0; n < 2; n++) await plusButtons.nth(i).click()
  await page.getByRole('button', { name: 'Next →' }).click()
  await page.getByRole('button', { name: 'Next →' }).click() // skills: nothing to choose

  // Abilities: Physical Skills plus three others
  await expect(page.getByRole('heading', { name: 'Choose Tier-1 Abilities' })).toBeVisible()
  await page.getByRole('button', { name: /^Physical Skills/ }).click()
  const abilityButtons = page.locator('div.flex.max-h-\\[340px\\] button')
  for (let i = 0; i < 3; i++) await abilityButtons.nth(i).click()
  await expect(page.getByText('4 / 4 selected')).toBeVisible()

  // Its skill picker appears, and Next is blocked until two are chosen
  await expect(
    page.getByText(/Physical Skills — choose 2 skills \(0 \/ 2 selected\)/),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Next →' }).click()
  await expect(page.getByText('Choose the skills each ability above trains you in.')).toBeVisible()

  await page.getByRole('button', { name: 'Climbing', exact: true }).click()
  await page.getByRole('button', { name: 'Swimming', exact: true }).click()
  await expect(page.getByText(/\(2 \/ 2 selected\)/)).toBeVisible()
  // A third pick is refused: the picker is full
  await page.getByRole('button', { name: 'Running', exact: true }).click()
  await expect(page.getByText(/\(2 \/ 2 selected\)/)).toBeVisible()

  await page.getByRole('button', { name: 'Next →' }).click() // equipment
  await page.getByRole('button', { name: 'Next →' }).click() // background
  await page.getByPlaceholder('e.g. Kessa Verne').fill('Skills Hero')
  await page.getByRole('button', { name: 'Next →' }).click()
  await page.getByRole('button', { name: 'Save Character' }).click()

  await expect(page.getByRole('heading', { name: 'Skills Hero' })).toBeVisible()
  await expect(page.getByText('Climbing', { exact: true })).toBeVisible()
  await expect(page.getByText('Swimming', { exact: true })).toBeVisible()

  // Clean up so the other specs still see an empty list
  await page.getByRole('link', { name: '← My Characters' }).click()
  await page.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('No characters yet.')).toBeVisible()
})
