import { expect, test, type Page } from '@playwright/test'

import { createCharacter, deleteCharacter } from './helpers'

// Needs graphql-api running (pnpm dev:api). Gaining a flavor in play: it costs
// 4 XP (or nothing when the GM granted it), may exchange Type abilities for the
// flavor's, shows on the sheet, and can be undone for a refund.
test.describe.configure({ mode: 'serial' })

const NAME = 'Flavor Gainer'
let playUrl = ''

const tab = (page: Page, name: string) => page.getByRole('tab', { name })
const settled = (page: Page) => expect(page.getByText('Syncing…')).toHaveCount(0)
const panel = (page: Page, title: string | RegExp) =>
  page.locator('section').filter({ has: page.getByRole('heading', { name: title, level: 2 }) })

async function gainXp(page: Page, amount: number) {
  await tab(page, 'XP Log').click()
  await page.getByPlaceholder('Description (e.g. GM intrusion, milestone)').fill('Milestone')
  await page.getByLabel('XP', { exact: true }).fill(String(amount))
  await page.getByRole('button', { name: 'Gain', exact: true }).click()
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByText('Milestone')).toBeVisible()
  await tab(page, 'Status').click()
}

test('setup: a saved Warrior with no flavor', async ({ page }) => {
  await createCharacter(page, NAME)
  await page.getByRole('link', { name: 'Play' }).click()
  // Client-side navigation: the URL changes once the play page has arrived.
  await expect(page).toHaveURL(/\/characters\/[0-9a-f-]+\/play$/)
  playUrl = page.url()
  await expect(panel(page, 'Gain a flavor')).toBeVisible()
})

test('paid: needs 4 XP, exchanges a Type ability, and can be undone for a refund', async ({
  page,
}) => {
  await page.goto(playUrl)
  const gain = panel(page, 'Gain a flavor')
  await gain.getByRole('button', { name: 'Gain a flavor…' }).click()
  await expect(gain.getByText(/Talk to your GM first/)).toBeVisible()

  // No XP yet: choosing a flavor is not enough
  await gain.getByRole('button', { name: 'Stealth', exact: true }).click()
  await expect(gain.getByRole('button', { name: 'Gain flavor (4 XP)' })).toBeDisabled()
  await expect(gain.getByText('Needs 4 XP')).toBeVisible()
  await gain.getByRole('button', { name: 'Cancel' }).click()

  await gainXp(page, 4)
  await gain.getByRole('button', { name: 'Gain a flavor…' }).click()
  await gain.getByRole('button', { name: 'Stealth', exact: true }).click()

  // One exchange: Bash (tier 1) for Goad (a tier-1 Stealth ability). Incomplete rows block the buy.
  await gain.getByRole('button', { name: 'Add an exchange' }).click()
  await expect(gain.getByRole('button', { name: 'Gain flavor (4 XP)' })).toBeDisabled()
  await gain.getByLabel('Give up 1').selectOption({ label: 'Bash · Tier 1' })
  await gain.getByLabel('Take instead 1').selectOption({ label: 'Goad · Tier 1' })
  await gain.getByRole('button', { name: 'Gain flavor (4 XP)' }).click()

  const gained = panel(page, 'Flavor gained in play: Stealth')
  await expect(gained).toBeVisible()
  await expect(gained.getByText('Bash → Goad (tier 1)')).toBeVisible()
  await settled(page)

  // The XP was spent, the ability changed, and the flavor labels it
  await tab(page, 'XP Log').click()
  await expect(page.getByText('Gained the Stealth flavor')).toBeVisible()
  await expect(page.getByText(/XP Log · 0 XP/)).toBeVisible()
  await page.reload()
  await tab(page, 'Abilities').click()
  await expect(page.getByRole('listitem').filter({ hasText: 'Goad' }).first()).toContainText(
    'Flavor',
  )
  await expect(page.getByRole('heading', { name: 'Bash' })).toHaveCount(0)
  await expect(page.getByText('Bash', { exact: true })).toHaveCount(0)

  // In the wizard the flavor is locked
  await page.goto(playUrl.replace('/play', '/edit'))
  await page
    .locator('div.border-b')
    .filter({ hasText: 'ABILITIES' })
    .getByRole('button', { name: 'Edit' })
    .click()
  await expect(page.getByText('Gained in play: Stealth')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Combat', exact: true })).toHaveCount(0)

  // Undo: the flavor goes, Bash is back, and the 4 XP too
  await page.goto(playUrl)
  await panel(page, 'Flavor gained in play: Stealth')
    .getByRole('button', { name: 'Undo (refunds 4 XP)' })
    .click()
  await expect(panel(page, 'Gain a flavor')).toBeVisible()
  await settled(page)
  await tab(page, 'XP Log').click()
  await expect(page.getByText(/XP Log · 4 XP/)).toBeVisible()
  await tab(page, 'Abilities').click()
  await expect(page.getByText('Bash', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Goad', { exact: true })).toHaveCount(0)
})

test('free: a flavor granted by the GM costs no XP, and so refunds none', async ({ page }) => {
  await page.goto(playUrl)
  const gain = panel(page, 'Gain a flavor')
  await gain.getByRole('button', { name: 'Gain a flavor…' }).click()
  await gain.getByRole('button', { name: 'Stealth', exact: true }).click()
  await gain.getByLabel('My GM granted it (character arc) — no XP').check()
  await gain.getByRole('button', { name: 'Gain flavor (granted)' }).click()

  const gained = panel(page, 'Flavor gained in play: Stealth')
  await expect(gained).toBeVisible()
  await expect(
    gained.getByText('No exchanges: the flavor only adds to your future choices.'),
  ).toBeVisible()
  await settled(page)
  await tab(page, 'XP Log').click()
  await expect(page.getByText(/XP Log · 4 XP/)).toBeVisible() // unchanged
  await tab(page, 'Status').click()
  await gained.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(panel(page, 'Gain a flavor')).toBeVisible()
  await settled(page)
  await tab(page, 'XP Log').click()
  await expect(page.getByText(/XP Log · 4 XP/)).toBeVisible()
})

test('cleanup', async ({ page }) => {
  await deleteCharacter(page, NAME)
})
