import { test, expect } from '@playwright/test'

const url = "https://grist.numerique.gouv.fr/o/dgcl/rqTZnqCnMA8U/Bac-a-sable-Charline-Playwright/p/10"

test('la page est affichée', async ({ page }) => {
  await page.goto(url)
  const widget = page.locator('iframe').contentFrame().locator('iframe').contentFrame()
  await expect(widget.locator('[data-testid="title"]')).toBeVisible({ timeout: 15000 })
})