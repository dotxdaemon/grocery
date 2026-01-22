// ABOUTME: Verifies items added offline persist across reloads.
// ABOUTME: Ensures the service worker and Dexie storage keep data available offline.
import { expect, test } from '@playwright/test'

test('retains items added offline after reload', async ({ page, context }) => {
  await page.goto('/')
  await page.waitForFunction(() => 'serviceWorker' in navigator)
  const hasController = await page.evaluate(() => navigator.serviceWorker.controller !== null)
  if (!hasController) {
    await page.reload()
  }
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)

  await context.setOffline(true)

  const addInput = page.getByRole('textbox', { name: 'Add an item' })
  await addInput.fill('Bananas')
  await addInput.press('Enter')
  await expect(page.getByText('Bananas')).toBeVisible()

  await page.reload()

  await expect(page.getByRole('textbox', { name: 'Add an item' })).toHaveValue('')
  await expect(page.getByText('Bananas')).toBeVisible()
})
