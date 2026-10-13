import { expect, test } from '@playwright/test'
import { Pool } from 'pg'

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
  await expect(page.getByText('Choose the skills each ability above improves.')).toBeVisible()

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

  // A character saved before skill choices existed has no such field in its
  // stored choices; it must still open (sheet and edit) rather than crash.
  const db = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    await db.query(
      `update character set choices = choices - 'abilitySkillChoices' where name = 'Skills Hero'`,
    )
  } finally {
    await db.end()
  }
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Skills Hero' })).toBeVisible()
  await page.getByRole('link', { name: 'Edit' }).click()
  await expect(page.getByRole('heading', { name: 'Review Your Character' })).toBeVisible()
  await page.getByRole('link', { name: '← Character sheet' }).click()
  await expect(page.getByRole('heading', { name: 'Skills Hero' })).toBeVisible()

  // Clean up so the other specs still see an empty list
  await page.getByRole('link', { name: '← My Characters' }).click()
  await page.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('No characters yet.')).toBeVisible()
})

// "An area of knowledge" can't be listed: the player types it, and the sheet
// shows it as written next to catalog skills.
test('a typed skill is accepted for an ability that allows one', async ({ page }) => {
  await page.goto('/en/characters/new')

  await page.getByRole('button', { name: /Explorer/ }).click()
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

  await page.getByRole('button', { name: /^Knowledge Skills/ }).click()
  const abilityButtons = page.locator('div.flex.max-h-\\[340px\\] button')
  for (let i = 0; i < 3; i++) await abilityButtons.nth(i).click()
  await expect(page.getByText('4 / 4 selected')).toBeVisible()

  // One catalog skill and one the player types
  await page.getByRole('button', { name: 'History', exact: true }).click()
  await page.getByPlaceholder(/type your own/).fill('  Ancient   Runes ')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByText(/\(2 \/ 2 selected\)/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ancient Runes', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Next →' }).click() // equipment
  await page.getByRole('button', { name: 'Next →' }).click() // background
  await page.getByPlaceholder('e.g. Kessa Verne').fill('Runes Hero')
  await page.getByRole('button', { name: 'Next →' }).click()
  await page.getByRole('button', { name: 'Save Character' }).click()

  await expect(page.getByRole('heading', { name: 'Runes Hero' })).toBeVisible()
  await expect(page.getByText('Ancient Runes', { exact: true })).toBeVisible()
  await expect(page.getByText('History', { exact: true })).toBeVisible()

  await page.getByRole('link', { name: '← My Characters' }).click()
  await page.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('No characters yet.')).toBeVisible()
})

// The Descriptor's "N skills of your choice": one of them can be typed.
test('a Descriptor skill choice can be a typed skill', async ({ page }) => {
  await page.goto('/en/characters/new')

  await page.getByRole('button', { name: /Warrior/ }).click()
  await page.getByRole('button', { name: /Might \+1/ }).click()
  await page.getByRole('button', { name: 'Next →' }).click()

  await page.getByPlaceholder(/Search \d+ descriptors…/).fill('Calm')
  await page.getByRole('button', { name: /^Calm/ }).first().click()
  await page.getByRole('button', { name: 'Next →' }).click()

  await page.getByPlaceholder(/Search \d+ foci…/).fill('Bears a Halo of Fire')
  await page.getByRole('button', { name: 'Bears a Halo of Fire' }).click()
  await page.getByRole('button', { name: 'Next →' }).click()

  const plusButtons = page.locator('button:has-text("+")')
  for (let i = 0; i < 3; i++) for (let n = 0; n < 2; n++) await plusButtons.nth(i).click()
  await page.getByRole('button', { name: 'Next →' }).click()

  // Calm: four skills of your choice — three from the list, one typed
  await expect(page.getByRole('heading', { name: 'Choose Trained Skills' })).toBeVisible()
  for (const name of ['Climbing', 'Jumping', 'Running']) {
    await page.getByRole('button', { name, exact: true }).click()
  }
  await page.getByPlaceholder(/type your own/).fill('Chess')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByText('4 / 4')).toBeVisible()
  await expect(page.getByRole('button', { name: /Chess/ })).toBeVisible()
  await page.getByRole('button', { name: 'Next →' }).click()

  const abilityButtons = page.locator('div.flex.max-h-\\[340px\\] button')
  await expect(abilityButtons.first()).toBeVisible()
  for (let i = 0; i < 4; i++) await abilityButtons.nth(i).click()
  await page.getByRole('button', { name: 'Next →' }).click() // equipment
  await page.getByRole('button', { name: 'Next →' }).click() // background
  await page.getByPlaceholder('e.g. Kessa Verne').fill('Chess Hero')
  await page.getByRole('button', { name: 'Next →' }).click()
  await page.getByRole('button', { name: 'Save Character' }).click()

  await expect(page.getByRole('heading', { name: 'Chess Hero' })).toBeVisible()
  await expect(page.getByText('Chess', { exact: true })).toBeVisible()

  await page.getByRole('link', { name: '← My Characters' }).click()
  await page.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('No characters yet.')).toBeVisible()
})
