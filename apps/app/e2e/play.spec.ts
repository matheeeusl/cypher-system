import { expect, test, type Page } from '@playwright/test'

import { createCharacter, deleteCharacter } from './helpers'

// Needs graphql-api running (pnpm dev:api). Shares one character across the
// steps below so the whole play loop reads as one story; workers: 1 keeps it
// from racing the wizard spec over the same test user.
test.describe.configure({ mode: 'serial' })

const NAME = 'Play Hero'
let playUrl = ''

const pool = (page: Page, name: string) => page.getByRole('meter', { name }).locator('..')
const tab = (page: Page, name: string) => page.getByRole('tab', { name })

// Taps are optimistic and sent in the background; reloading before the queue
// drains would drop them (the app warns about that too).
const settled = (page: Page) => expect(page.getByText('Syncing…')).toHaveCount(0)

async function addXp(page: Page, amount: number, reason: string) {
  await tab(page, 'Log & Notes').click()
  await page.getByPlaceholder('Description (e.g. GM intrusion, milestone)').fill(reason)
  await page.getByLabel('XP', { exact: true }).fill(String(amount))
  await page.getByRole('button', { name: 'Gain', exact: true }).click()
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByText(reason)).toBeVisible()
}

test('opens play mode from the sheet', async ({ page }) => {
  await createCharacter(page, NAME)
  await page.getByRole('link', { name: 'Play' }).click()
  await expect(page).toHaveURL(/\/en\/characters\/[0-9a-f-]+\/play$/)
  playUrl = page.url()
  await expect(page.getByText('Hale', { exact: true })).toBeVisible()
  await expect(pool(page, 'Might')).toContainText('12 / 12')
})

/** Ticks the first `count` options of a level-up picker and confirms it. */
async function completePicks(page: Page, heading: RegExp, count: number) {
  const panel = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: heading }) })
  await expect(panel).toBeVisible()
  const confirm = panel.getByRole('button', { name: 'Confirm choices' })
  await expect(confirm).toBeDisabled()
  for (let i = 0; i < count; i++) await panel.getByRole('checkbox').nth(i).check()
  await confirm.click()
  await expect(panel).toHaveCount(0)
}

/**
 * Answers every owed "choose the skills it improves" panel (a Type ability that
 * grants skills, like Physical Skills or Skill with Attacks, owes its picks
 * once it's learned). Ticks the first options of each, as many as it asks for.
 */
async function completeSkillPicks(page: Page) {
  const heading = page.getByRole('heading', { name: /choose the skills it improves/ })
  for (let n = await heading.count(); n > 0; n = await heading.count()) {
    const panel = page.locator('section').filter({ has: heading.first() })
    const hint =
      (await panel
        .getByText(/^Choose \d+/)
        .first()
        .textContent()) ?? ''
    const required = Number(/Choose (\d+)/.exec(hint)?.[1] ?? 1)
    for (let i = 0; i < required; i++) await panel.getByRole('checkbox').nth(i).check()
    await panel.getByRole('button', { name: 'Confirm choices' }).click()
    await expect(heading).toHaveCount(n - 1)
  }
}

async function poolAction(page: Page, name: string, action: 'Spend' | 'Recover', amount: number) {
  const p = pool(page, name)
  await p.getByRole('button', { name: `${action} X` }).click()
  await p.getByLabel(new RegExp(`^${action} — Amount`)).fill(String(amount))
  await p.getByRole('button', { name: 'Confirm' }).click()
}

test('pools: spending and recovering persist and drive the damage track', async ({ page }) => {
  await page.goto(playUrl)
  await poolAction(page, 'Might', 'Spend', 3)
  await expect(pool(page, 'Might')).toContainText('9 / 12')
  await settled(page)

  // Survives a reload (saved on the server, not just on screen)
  await expect(async () => {
    await page.reload()
    await expect(pool(page, 'Might')).toContainText('9 / 12')
  }).toPass()

  // Recover a custom amount, then overspend: it stops at 0
  await poolAction(page, 'Might', 'Recover', 2)
  await expect(pool(page, 'Might')).toContainText('11 / 12')
  await poolAction(page, 'Might', 'Spend', 20)
  await expect(pool(page, 'Might')).toContainText('0 / 12')
  await expect(page.getByText('Impaired', { exact: true })).toBeVisible()

  // A second Pool at 0 -> Debilitated
  await poolAction(page, 'Intellect', 'Spend', 10)
  await expect(pool(page, 'Intellect')).toContainText('0 / 10')
  await expect(page.getByText('Debilitated', { exact: true })).toBeVisible()

  await pool(page, 'Might').getByRole('button', { name: 'Full recovery' }).click()
  await pool(page, 'Intellect').getByRole('button', { name: 'Full recovery' }).click()
  await expect(page.getByText('Hale', { exact: true })).toBeVisible()

  // The screen is optimistic — wait until the server really has the recovery
  await settled(page)
  await expect(async () => {
    await page.reload()
    await expect(pool(page, 'Might')).toContainText('12 / 12')
    await expect(pool(page, 'Intellect')).toContainText('10 / 10')
  }).toPass()
})

test('XP: spending more than you have is refused; advancing locks its XP entry', async ({
  page,
}) => {
  await page.goto(playUrl)
  await tab(page, 'Log & Notes').click()

  // Can't spend XP you don't have
  await page.getByPlaceholder('Description (e.g. GM intrusion, milestone)').fill('Too much')
  await page.getByRole('button', { name: 'Spend', exact: true }).click()
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByText('Not enough XP to spend that much.')).toBeVisible()

  await addXp(page, 4, 'First milestone')
  await tab(page, 'Status').click()
  await expect(page.getByText('0 / 4 steps · 4 XP available')).toBeVisible()

  // Extra Effort: no picker, applies immediately
  await page
    .getByRole('listitem')
    .filter({ hasText: 'Extra Effort' })
    .getByRole('button', { name: 'Purchase' })
    .click()
  await expect(page.getByText('1 / 4 steps · 0 XP available')).toBeVisible()
  await expect(page.getByText('Effort 2', { exact: true }).first()).toBeVisible()

  // Its XP entry is locked: no remove button on the spend row
  await tab(page, 'Log & Notes').click()
  const spendRow = page.getByRole('listitem').filter({ hasText: 'Extra Effort' })
  await expect(spendRow).toContainText('−4 XP')
  await expect(spendRow.getByRole('button', { name: 'Remove entry' })).toHaveCount(0)
})

test('advancement: completing a tier levels up; the next tier stops before an unsupported one', async ({
  page,
}) => {
  await page.goto(playUrl)
  await addXp(page, 12, 'Big milestone')
  await tab(page, 'Status').click()

  // Increasing Capabilities -> picker -> Might
  const buy = (step: string) =>
    page.getByRole('listitem').filter({ hasText: step }).getByRole('button', { name: 'Purchase' })
  await buy('Increasing Capabilities').click()
  // Split the 4 points: 3 to Might, 1 to Speed (confirm stays disabled until all 4 are used)
  const confirm = page.getByRole('button', { name: 'Confirm' })
  await expect(confirm).toBeDisabled()
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Add to Might' }).click()
  await expect(confirm).toBeDisabled()
  await page.getByRole('button', { name: 'Add to Speed' }).click()
  await expect(page.getByRole('button', { name: 'Add to Intellect' })).toBeDisabled()
  await confirm.click()
  await expect(pool(page, 'Might')).toContainText('15 / 15')

  await buy('Moving Toward Perfection').click()
  await page.getByRole('button', { name: /^Speed \(/ }).click()

  // Skills -> searchable picker
  await buy('Skills —').click()
  await page.getByPlaceholder(/Search skills/).fill('Climbing')
  await page.getByRole('button', { name: /^Climbing \(/ }).click()

  await expect(page.getByText('✓ Advanced to Tier 2 — all four steps purchased.')).toBeVisible()
  await expect(page.getByText('Tier 2', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('0 / 4 steps')).toBeVisible()

  // Reaching tier 2 owes two Type abilities (a Warrior picks 2 at tier 2)
  await completePicks(page, /Tier 2 — choose your Type abilities/, 2)
  await expect(page.getByText(/Tier 2 — choose your Type abilities/)).toHaveCount(0)
  await completeSkillPicks(page)
  await settled(page)
  await expect(async () => {
    await page.reload()
    await expect(page.getByText(/Tier 2 — choose your Type abilities/)).toHaveCount(0)
    await expect(page.getByText('Tier 2', { exact: true }).first()).toBeVisible()
  }).toPass()

  // Tier 2: train a known ability with the Skills advancement, then reach tier 3
  await addXp(page, 16, 'Another milestone')
  await tab(page, 'Status').click()
  await buy('Increasing Capabilities').click()
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Add to Speed' }).click()
  await page.getByRole('button', { name: 'Confirm' }).click()
  await expect(page.getByText('1 / 4 steps')).toBeVisible()
  await buy('Moving Toward Perfection').click()
  await page.getByRole('button', { name: /^Might \(/ }).click()
  await expect(page.getByText('2 / 4 steps')).toBeVisible()
  await buy('Extra Effort').click()
  await expect(page.getByText('3 / 4 steps')).toBeVisible()
  await buy('Skills —').click()
  // Skills and special abilities are separate lists
  await expect(page.getByRole('button', { name: /— ability \(train\)$/ })).toHaveCount(0)
  await page.getByRole('button', { name: 'Train a special ability instead →' }).click()
  // Only attack abilities can be trained: Improved Edge (an enabler) isn't offered
  await expect(page.getByRole('button', { name: /^Bash — ability \(train\)$/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Improved Edge/ })).toHaveCount(0)
  await page.getByRole('button', { name: /^Bash — ability \(train\)$/ }).click()

  await expect(page.getByText('✓ Advanced to Tier 3 — all four steps purchased.')).toBeVisible()
  await completePicks(page, /Tier 3 — choose your Type abilities/, 3)
  // Some Foci also offer a choice at tier 3
  const focusPick = page.getByRole('heading', { name: /Tier 3 — choose a Focus ability/ })
  if (await focusPick.isVisible()) await completePicks(page, /Tier 3 — choose a Focus ability/, 1)
  await completeSkillPicks(page)
  await settled(page)
  await expect(page.getByText(/— choose/)).toHaveCount(0)

  // The trained ability is marked in the Skills tab
  await tab(page, 'Skills').click()
  await expect(page.getByRole('listitem').filter({ hasText: 'Bash' })).toContainText('Trained')
})

test('advancement: the Skills advancement can train a skill typed by the player', async ({
  page,
}) => {
  await page.goto(playUrl)
  await addXp(page, 4, 'Typed skill')
  await tab(page, 'Status').click()

  await page
    .getByRole('listitem')
    .filter({ hasText: 'Skills —' })
    .getByRole('button', { name: 'Purchase' })
    .click()
  await page.getByPlaceholder(/Search skills/).fill('Falconry')
  await page.getByRole('button', { name: /Train “Falconry” as a new skill/ }).click()
  await settled(page)

  await tab(page, 'Skills').click()
  await expect(page.getByText('Falconry', { exact: true })).toBeVisible()
})

test('inventory: items, quantities, the cypher catalog and the cypher limit warning', async ({
  page,
}) => {
  await page.goto(playUrl)
  await tab(page, 'Inventory').click()
  await expect(page.getByText('Cyphers 0 / 2')).toBeVisible()

  await page.getByPlaceholder('Item name').fill('Rope')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  const rope = page.getByRole('listitem').filter({ hasText: 'Rope' })
  await expect(rope).toContainText('Gear')
  await rope.getByRole('button', { name: 'Increase quantity' }).click()
  await expect(rope).toContainText('2')

  // Real cyphers from the catalog; Warriors can bear 2, so a third warns
  await page.getByRole('button', { name: 'Browse Cyphers' }).click()
  for (const name of ['Adhesion', 'Age Taker', 'Analeptic']) {
    await page.getByPlaceholder('Search cyphers…').fill(name)
    await page
      .getByRole('button', { name: new RegExp(`^${name}`, 'i') })
      .first()
      .click()
    await page.getByRole('button', { name: '+ Add to Inventory' }).click()
    await expect(page.getByRole('listitem').filter({ hasText: name }).first()).toBeVisible()
  }
  await expect(page.getByText('Cyphers 3 / 2')).toBeVisible()
  await expect(page.getByText(/more cyphers than your limit of 2/)).toBeVisible()

  // Persisted
  await settled(page)
  await page.reload()
  await tab(page, 'Inventory').click()
  await expect(page.getByText('Cyphers 3 / 2')).toBeVisible()
  await expect(page.getByRole('listitem').filter({ hasText: 'Rope' })).toBeVisible()
})

test('notes autosave; the sheet shows live pools and XP; pt-br works', async ({ page }) => {
  await page.goto(playUrl)
  await tab(page, 'Log & Notes').click()
  await page.getByLabel('Notes').fill('Ask the GM about the Sunken Archive.')
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
  await page.reload()
  await tab(page, 'Log & Notes').click()
  await expect(page.getByLabel('Notes')).toHaveValue('Ask the GM about the Sunken Archive.')

  // Spend a point, then check the printable sheet reflects it
  await tab(page, 'Status').click()
  await poolAction(page, 'Speed', 'Spend', 1)
  await expect(async () => {
    await page.goto(playUrl.replace(/\/play$/, ''))
    await expect(page.getByRole('heading', { name: NAME })).toBeVisible()
    await expect(page.getByText('Tier 3').first()).toBeVisible()
    await expect(page.getByText('Rope')).toBeVisible()
  }).toPass()

  // Portuguese
  await page.goto(playUrl.replace('/en/', '/pt-br/'))
  await expect(page.getByText('Íntegro', { exact: true })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Perícias e Habilidades' })).toBeVisible()
  await expect(page.getByText('Aumentando Capacidades')).toBeVisible()
})

test('XP log: paginates ten entries to a page, newest first', async ({ page }) => {
  await page.goto(playUrl)
  await tab(page, 'Log & Notes').click()

  // Six gain/spend pairs of 1 XP: twelve more entries, net zero XP
  const reason = page.getByPlaceholder(/^Description/)
  for (let i = 1; i <= 6; i++) {
    for (const kind of ['Gain', 'Spend']) {
      await page.getByRole('button', { name: kind, exact: true }).click()
      await reason.fill(`Page test ${kind} ${i}`)
      await page.getByRole('button', { name: 'Add', exact: true }).click()
      await expect(page.getByText(`Page test ${kind} ${i}`)).toBeVisible()
    }
  }

  const nav = page.getByRole('navigation', { name: /XP Log/ })
  await expect(nav.getByText(/^Page 1 of \d+$/)).toBeVisible()
  // The newest entry is on the first page; the oldest ones are not
  await expect(page.getByText('Page test Spend 6')).toBeVisible()
  await expect(page.getByText('Big milestone')).toHaveCount(0)
  await expect(nav.getByRole('button', { name: '← Newer' })).toBeDisabled()

  await nav.getByRole('button', { name: 'Older →' }).click()
  await expect(nav.getByText(/^Page 2 of \d+$/)).toBeVisible()
  await expect(page.getByText('Page test Spend 6')).toHaveCount(0)

  // Adding an entry returns to the first page
  await page.getByRole('button', { name: 'Gain', exact: true }).click()
  await reason.fill('Newest entry')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(nav.getByText(/^Page 1 of \d+$/)).toBeVisible()
  await expect(page.getByText('Newest entry')).toBeVisible()
})

test('Skills tab: a skill opens its description; a typed one says it is yours', async ({
  page,
}) => {
  await page.goto(playUrl)
  await tab(page, 'Skills').click()

  await page.getByRole('button', { name: /^Initiative/ }).click()
  await expect(
    page.getByText('Initiative actions, such as determining who goes first in combat.'),
  ).toBeVisible()

  // Clicking again closes it
  await page.getByRole('button', { name: /^Initiative/ }).click()
  await expect(page.getByText('Initiative actions, such as determining')).toHaveCount(0)

  // The skill typed in the advancement test has no rules text of its own
  await page.getByRole('button', { name: /^Falconry/ }).click()
  await expect(page.getByText(/Created by you/)).toBeVisible()
})

test('cleanup', async ({ page }) => {
  await deleteCharacter(page, NAME)
})
