import { expect, type Page } from '@playwright/test'

/** Walks the English wizard with fixed picks (Brash Warrior who Bears a Halo of Fire) and saves. */
export async function createCharacter(page: Page, name: string): Promise<void> {
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

  const plus = page.locator('button:has-text("+")')
  for (let i = 0; i < 2; i++) await plus.nth(0).click()
  for (let i = 0; i < 2; i++) await plus.nth(1).click()
  for (let i = 0; i < 2; i++) await plus.nth(2).click()
  await page.getByRole('button', { name: 'Next →' }).click()
  await page.getByRole('button', { name: 'Next →' }).click() // skills (none to pick)

  const abilities = page.locator('div.flex.max-h-\\[340px\\] button')
  await expect(abilities.first()).toBeVisible()
  for (let i = 0; i < 4; i++) await abilities.nth(i).click()
  await page.getByRole('button', { name: 'Next →' }).click() // equipment
  await page.getByRole('button', { name: 'Next →' }).click() // background
  await page.getByPlaceholder('e.g. Kessa Verne').fill(name)
  await page.getByRole('button', { name: 'Next →' }).click()

  await page.getByRole('button', { name: 'Save Character' }).click()
  await expect(page.getByRole('heading', { name })).toBeVisible()
}

/** Deletes the character on the list page through the confirmation dialog. */
export async function deleteCharacter(page: Page, name: string): Promise<void> {
  await page.goto('/en')
  await expect(page.getByRole('link', { name: new RegExp(name) })).toBeVisible()
  await page.getByRole('button', { name: 'Delete' }).first().click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByRole('link', { name: new RegExp(name) })).toHaveCount(0)
}
