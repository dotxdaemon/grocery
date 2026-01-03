// ABOUTME: Playwright smoke test covering list creation and basic item flow.
// ABOUTME: Ensures quick add, purchase toggles, and export actions work end-to-end.
import { expect, test } from '@playwright/test'

test.setTimeout(120_000)

test('create list, add item, purchase, and export', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('heading', { name: 'Your lists' }).waitFor({ timeout: 120_000 })

  await page.getByPlaceholder('Add a list (e.g., Costco, Safeway)').fill('Playwright List')
  await page.getByRole('button', { name: 'Create' }).click()

  const card = page.getByRole('heading', { name: 'Playwright List' }).locator('..').locator('..')
  await card.getByRole('button', { name: 'Open list' }).click()

  await page.getByLabel('Quick add item').fill('2 milk')
  await page.getByRole('button', { name: 'Add' }).click()
  await expect(page.getByText('milk', { exact: false })).toBeVisible()

  await page.getByLabel('Toggle milk').click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Clear purchased' }).click()
  await expect(page.getByText('No items yet')).toBeVisible()

  await page.getByRole('link', { name: 'Settings' }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toContain('grocery-export')
})
