import { expect, test, type Page } from '@playwright/test'

import { createCharacter, deleteCharacter } from './helpers'

// Needs graphql-api running (pnpm dev:api). One story: a Warrior gets the
// Stealth flavor, levels up to tier 2, and picks a Stealth ability as one of
// the two Type abilities owed at that tier.
test.describe.configure({ mode: 'serial' })

const NAME = 'Flavor Play'
let playUrl = ''

const tab = (page: Page, name: string) => page.getByRole('tab', { name })
const settled = (page: Page) => expect(page.getByText('Syncing…')).toHaveCount(0)

test('adds the Stealth flavor to a saved character', async ({ page }) => {
  await createCharacter(page, NAME)
  await page.getByRole('link', { name: 'Edit' }).click()
  await expect(page.getByRole('heading', { name: 'Review Your Character' })).toBeVisible()

  // The flavor is chosen on the Abilities step (the ABILITIES row's Edit button);
  // the four picks stay as they were
  await page
    .locator('div.border-b')
    .filter({ hasText: 'ABILITIES' })
    .getByRole('button', { name: 'Edit' })
    .click()
  await page.getByRole('button', { name: 'Stealth', exact: true }).click()
  await expect(page.getByText('4 / 4 selected')).toBeVisible()
  // Next x2 (equipment, background), then Next to the review step
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Next →' }).click()
  await expect(page.getByRole('heading', { name: 'Review Your Character' })).toBeVisible()
  await expect(page.getByText('FLAVOR', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Save Changes' }).click()
  await expect(page.getByRole('heading', { name: NAME })).toBeVisible()
  await expect(page.getByText('Flavor: Stealth').first()).toBeVisible()

  await page.getByRole('link', { name: 'Play' }).click()
  playUrl = page.url()
})

test('a tier-2 Type pick can be a flavor ability', async ({ page }) => {
  await page.goto(playUrl)
  await tab(page, 'XP Log').click()
  await page.getByPlaceholder('Description (e.g. GM intrusion, milestone)').fill('Milestone')
  await page.getByLabel('XP', { exact: true }).fill('16')
  await page.getByRole('button', { name: 'Gain', exact: true }).click()
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByText('Milestone')).toBeVisible()
  await tab(page, 'Status').click()

  const buy = (step: string) =>
    page.getByRole('listitem').filter({ hasText: step }).getByRole('button', { name: 'Purchase' })
  await buy('Increasing Capabilities').click()
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Add to Might' }).click()
  await page.getByRole('button', { name: 'Confirm' }).click()
  await buy('Moving Toward Perfection').click()
  await page.getByRole('button', { name: /^Speed \(/ }).click()
  await buy('Extra Effort').click()
  await buy('Skills —').click()
  await page.getByPlaceholder(/Search skills/).fill('Climbing')
  await page.getByRole('button', { name: /^Climbing \(/ }).click()
  await expect(page.getByText('✓ Advanced to Tier 2 — all four steps purchased.')).toBeVisible()

  // The owed Type abilities list the Warrior's and the flavor's, the latter labelled
  const panel = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: /Tier 2 — choose your Type abilities/ }) })
  await expect(panel).toBeVisible()
  await expect(panel.getByText('Flavor: Stealth').first()).toBeVisible()
  // Tier-1 flavor abilities are offered too (a lower tier is allowed)
  await expect(panel.getByText('Legerdemain', { exact: true })).toBeVisible()
  await expect(panel.getByText('Find an Opening', { exact: true })).toBeVisible()

  await panel.getByRole('checkbox', { name: /Find an Opening/ }).check()
  await panel.getByRole('checkbox', { name: /Legerdemain/ }).check()
  await panel.getByRole('button', { name: 'Confirm choices' }).click()
  await expect(panel).toHaveCount(0)
  await settled(page)

  // Saved: they survive a reload and the sheet credits them to the flavor
  await page.reload()
  await expect(page.getByText(/Tier 2 — choose your Type abilities/)).toHaveCount(0)
  await tab(page, 'Abilities').click()
  const row = (name: string) => page.getByRole('listitem').filter({ hasText: name })
  await expect(row('Find an Opening').first()).toContainText('Flavor')
  await expect(row('Legerdemain').first()).toContainText('Flavor')
})

test('cleanup', async ({ page }) => {
  await deleteCharacter(page, NAME)
})
