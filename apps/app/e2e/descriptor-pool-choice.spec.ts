import { expect, test, type Page } from '@playwright/test'

import { deleteCharacter } from './helpers'

// Requires graphql-api running separately (pnpm dev:api) — see
// playwright.config.ts and apps/app/CLAUDE.md.
//
// Descriptors whose Pool bonus the player decides: Sensational divides 4
// points, Sylph is +2 Intellect or +2 Speed. Both use a Warrior (10/10/8)
// with 2 of the 6 points in each Pool, so 12/12/10 before the Descriptor.

test.describe.configure({ mode: 'serial' })

async function pickWarrior(page: Page, next: string, mightEdge: RegExp) {
  await page.getByRole('button', { name: /Warrior|Guerreiro/ }).click()
  await page.getByRole('button', { name: mightEdge }).click()
  await page.getByRole('button', { name: next }).click()
}

async function finishFrom(page: Page, next: string, focus: string, focusSearch: RegExp) {
  await page.getByPlaceholder(focusSearch).fill(focus)
  await page.getByRole('button', { name: focus }).click()
  await page.getByRole('button', { name: next }).click()

  const plus = page.locator('button:has-text("+")')
  for (let i = 0; i < 3; i++) for (let n = 0; n < 2; n++) await plus.nth(i).click()
}

async function pickAbilitiesAndName(page: Page, next: string, placeholder: string, name: string) {
  const abilities = page.locator('div.flex.max-h-\\[340px\\] button')
  await expect(abilities.first()).toBeVisible()
  for (let i = 0; i < 4; i++) await abilities.nth(i).click()
  // The fourth is Improved Edge: Might is the starting Edge, so raise Intellect.
  await page.getByRole('button', { name: /^(Intellect|Intelecto) \+1$/ }).click()
  await page.getByRole('button', { name: next }).click() // equipment
  await page.getByRole('button', { name: next }).click() // background
  await page.getByPlaceholder(placeholder).fill(name)
  await page.getByRole('button', { name: next }).click() // review
}

test('a divide choice (Sensational) blocks Next until every point is placed', async ({ page }) => {
  await page.goto('/en/characters/new')
  await pickWarrior(page, 'Next →', /Might \+1/)

  await page.getByPlaceholder(/Search \d+ descriptors…/).fill('Sensational')
  await page.getByRole('button', { name: /Sensational/ }).click()
  await expect(page.getByText('Pool bonus: your choice')).toBeVisible()

  // Nothing divided yet: Next stays on the step and says why
  await page.getByRole('button', { name: 'Next →' }).click()
  await expect(page.getByText("Finish your Descriptor's Pool bonus choice")).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Choose Your Descriptor' })).toBeVisible()

  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Might +1' }).click()
  await page.getByRole('button', { name: 'Speed +1' }).click()
  // All 4 placed: no more "+"
  await expect(page.getByRole('button', { name: 'Intellect +1' })).toBeDisabled()
  await page.getByRole('button', { name: 'Next →' }).click()

  await finishFrom(page, 'Next →', 'Bears a Halo of Fire', /Search \d+ foci…/)
  await expect(page.getByText('10 base + 2 + 3 descriptor = 15')).toBeVisible()
  await page.getByRole('button', { name: 'Next →' }).click()

  // Sensational: one skill of your choice
  await page.getByRole('button', { name: 'Climbing', exact: true }).click()
  await page.getByRole('button', { name: 'Next →' }).click()

  await pickAbilitiesAndName(page, 'Next →', 'e.g. Kessa Verne', 'Divide Hero')
  await expect(page.getByText('Might 15 · Speed 13 · Intellect 10')).toBeVisible()

  // Saving goes through graphql-api's validation, which needs the choice
  await page.getByRole('button', { name: 'Save Character' }).click()
  await expect(page.getByRole('heading', { name: 'Divide Hero' })).toBeVisible()
  await deleteCharacter(page, 'Divide Hero')
})

test('[pt-br] a one-of choice (Sylph) is a radio; the search finds a genre', async ({ page }) => {
  await page.goto('/pt-br/characters/new')
  await pickWarrior(page, 'Próximo →', /Força \+1/)

  // Searching a genre lists its descriptors (seven Modern Magic ones)
  const search = page.getByPlaceholder(/Buscar entre \d+ descritores…/)
  await search.fill('Magia Moderna')
  await expect(page.getByText('7 exibidos')).toBeVisible()

  await search.fill('Sílfide')
  await page.getByRole('button', { name: /Sílfide/ }).click()
  await page.getByRole('radio', { name: '+2 Velocidade' }).check()
  await page.getByRole('button', { name: 'Próximo →' }).click()

  await finishFrom(page, 'Próximo →', 'Carrega uma Auréola de Fogo', /Buscar entre \d+ focos…/)
  await expect(page.getByText('10 base + 2 + 2 do descritor = 14')).toBeVisible()
  await page.getByRole('button', { name: 'Próximo →' }).click()
  await page.getByRole('button', { name: 'Próximo →' }).click() // skills (none to pick)

  await pickAbilitiesAndName(page, 'Próximo →', 'ex.: Kessa Verne', 'Herói Sílfide')
  await expect(page.getByText('Força 12 · Velocidade 14 · Intelecto 10')).toBeVisible()

  await page.getByRole('button', { name: 'Salvar Personagem' }).click()
  await expect(page.getByRole('heading', { name: 'Herói Sílfide' })).toBeVisible()
  await deleteCharacter(page, 'Herói Sílfide')
})
