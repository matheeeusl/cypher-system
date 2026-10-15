import { expect, test, type Page } from '@playwright/test'

import { createCharacter, deleteCharacter } from './helpers'

// Needs graphql-api running (pnpm dev:api). One story: only a character with the
// Modern Magic flavor can spend 2 XP to learn two more cantrips; the purchase
// shows in the XP log, joins the character, and can be undone for a refund.
test.describe.configure({ mode: 'serial' })

const NAME = 'Cantrip Learner'
let playUrl = ''

const tab = (page: Page, name: string) => page.getByRole('tab', { name })
const settled = (page: Page) => expect(page.getByText('Syncing…')).toHaveCount(0)
const learnPanel = (page: Page) =>
  page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Learn more — Cantrips', level: 2 }) })

test('only a character with the Modern Magic flavor has something to learn', async ({ page }) => {
  await createCharacter(page, NAME)
  await page.getByRole('link', { name: 'Play' }).click()
  await expect(page.getByText('Advancement', { exact: false }).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: /Learn more/ })).toHaveCount(0)
  await page.goBack()

  // Adding the Modern Magic flavor makes the panel appear
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

test('learning needs 2 XP, then adds the cantrips, and can be undone', async ({ page }) => {
  await page.goto(playUrl)
  const panel = learnPanel(page)
  await expect(panel).toBeVisible()
  await expect(panel.getByRole('button', { name: 'Learn (2 XP)' })).toBeDisabled()
  await expect(panel.getByText('Needs 2 XP')).toBeVisible()

  await tab(page, 'XP Log').click()
  await page.getByPlaceholder('Description (e.g. GM intrusion, milestone)').fill('Milestone')
  await page.getByLabel('XP', { exact: true }).fill('4')
  await page.getByRole('button', { name: 'Gain', exact: true }).click()
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByText('Milestone')).toBeVisible()
  await tab(page, 'Status').click()

  await panel.getByRole('button', { name: 'Learn (2 XP)' }).click()
  const confirm = panel.getByRole('button', { name: 'Learn (2 XP)' })
  await expect(confirm).toBeDisabled()
  await panel.getByRole('checkbox', { name: /Bee Cantrip/ }).check()
  await expect(confirm).toBeDisabled()
  await panel.getByRole('checkbox', { name: /Youth Cantrip/ }).check()
  await confirm.click()
  await expect(panel.getByText('Bee Cantrip, Youth Cantrip')).toBeVisible()
  await settled(page)

  // The XP log shows the locked spend; the cantrips are the flavor's abilities
  await tab(page, 'XP Log').click()
  await expect(page.getByText('Learned: Bee Cantrip, Youth Cantrip')).toBeVisible()
  await expect(page.getByText(/XP Log · 2 XP/)).toBeVisible()
  await page.reload()
  await tab(page, 'Abilities').click()
  // Cantrips are listed under their own heading, apart from the other abilities
  const cantrips = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Cantrips', exact: true, level: 2 }) })
  await expect(cantrips.getByRole('listitem')).toHaveCount(2)
  for (const name of ['Bee Cantrip', 'Youth Cantrip']) {
    await expect(page.getByRole('listitem').filter({ hasText: name }).first()).toContainText(
      'Flavor',
    )
  }

  // Undo: the cantrips go and the 2 XP come back as a gain
  await tab(page, 'Status').click()
  await learnPanel(page).getByRole('button', { name: /^Undo/ }).click()
  await expect(learnPanel(page).getByText('Bee Cantrip, Youth Cantrip')).toHaveCount(0)
  await settled(page)
  await tab(page, 'XP Log').click()
  await expect(page.getByText(/XP Log · 4 XP/)).toBeVisible()
  await tab(page, 'Abilities').click()
  await expect(page.getByRole('listitem').filter({ hasText: 'Bee Cantrip' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Cantrips', exact: true, level: 2 })).toHaveCount(
    0,
  )
})

test('cleanup', async ({ page }) => {
  await deleteCharacter(page, NAME)
})
