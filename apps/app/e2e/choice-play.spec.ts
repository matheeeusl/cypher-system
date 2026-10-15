import { expect, test, type Page } from '@playwright/test'

import { createCharacter, deleteCharacter } from './helpers'

// Needs graphql-api running (pnpm dev:api). One story: a Warrior with the Modern
// Magic flavor reaches tier 2 and takes Cantrips as a Type ability; that owes
// four cantrips, answered in play mode.
test.describe.configure({ mode: 'serial' })

const NAME = 'Cantrip Play'
let playUrl = ''

const tab = (page: Page, name: string) => page.getByRole('tab', { name })
const settled = (page: Page) => expect(page.getByText('Syncing…')).toHaveCount(0)

test('adds the Modern Magic flavor to a saved character', async ({ page }) => {
  await createCharacter(page, NAME)
  await page.getByRole('link', { name: 'Edit' }).click()
  await page
    .locator('div.border-b')
    .filter({ hasText: 'ABILITIES' })
    .getByRole('button', { name: 'Edit' })
    .click()
  await page.getByRole('button', { name: 'Modern Magic', exact: true }).click()
  await expect(page.getByText('4 / 4 selected')).toBeVisible()
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Next →' }).click()
  await page.getByRole('button', { name: 'Save Changes' }).click()
  await expect(page.getByRole('heading', { name: NAME })).toBeVisible()
  await page.getByRole('link', { name: 'Play' }).click()
  playUrl = page.url()
})

test('Cantrips taken at tier 2 owe four cantrips, which join the character', async ({ page }) => {
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

  // Tier 2: two Type abilities, one of them Cantrips (a tier-1 flavor ability)
  const typePanel = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: /Tier 2 — choose your Type abilities/ }) })
  await expect(typePanel).toBeVisible()
  await typePanel.getByRole('checkbox', { name: /Cantrips/ }).check()
  await typePanel.getByRole('checkbox', { name: /Annoy Electronics/ }).check()
  await typePanel.getByRole('button', { name: 'Confirm choices' }).click()
  await expect(typePanel).toHaveCount(0)

  // Cantrips now owes its four picks; confirm stays off until all four are ticked
  const cantripPanel = page.locator('section').filter({
    has: page.getByRole('heading', { name: /Cantrips \(tier 2\) — choose its abilities/ }),
  })
  await expect(cantripPanel).toBeVisible()
  const confirm = cantripPanel.getByRole('button', { name: 'Confirm choices' })
  await expect(confirm).toBeDisabled()
  for (const name of ['Bee Cantrip', 'Candles Cantrip', 'Light Switch Cantrip']) {
    await cantripPanel.getByRole('checkbox', { name: new RegExp(name) }).check()
  }
  await expect(confirm).toBeDisabled()
  await cantripPanel.getByRole('checkbox', { name: /Youth Cantrip/ }).check()
  await confirm.click()
  await expect(cantripPanel).toHaveCount(0)
  await settled(page)

  // Saved: the four cantrips are abilities of the character, credited to the flavor
  await page.reload()
  await expect(page.getByText(/choose its abilities/)).toHaveCount(0)
  await tab(page, 'Abilities').click()
  for (const name of ['Bee Cantrip', 'Candles Cantrip', 'Light Switch Cantrip', 'Youth Cantrip']) {
    await expect(page.getByRole('listitem').filter({ hasText: name }).first()).toContainText(
      'Flavor',
    )
  }
})

test('cleanup', async ({ page }) => {
  await deleteCharacter(page, NAME)
})
