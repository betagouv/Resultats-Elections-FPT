import { test, expect } from '@playwright/test'
import helper from '../playwright/helper.js'
import mockedLogin from '../playwright/mockedLogin.js'

// Création des URLs
const url = helper.getUrl("accueil")
const urlPref = url + helper.viewAsPref
const urlAdmin = url + helper.viewAsAdmin

// Force une connexion en tant que propriétaire
test.use({ storageState: mockedLogin })

test('la page d\'accueil s\’affiche pour un utilisateur PREF', async ({ page }) => {
  await page.goto(urlPref)
  const widget = page.locator('iframe').contentFrame().locator('iframe').contentFrame()
  await expect(widget.locator('[data-testid="title"]')).toBeVisible({ timeout: 15000 })
})

test('la page d\'accueil s\’affiche pour un utilisateur ADMIN', async ({ page }) => {
  await page.goto(urlAdmin)
  const widget = page.locator('iframe').contentFrame().locator('iframe').contentFrame()
  await expect(widget.locator('[data-testid="title"]')).toBeVisible({ timeout: 15000 })
})