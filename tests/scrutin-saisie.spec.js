import { test, expect } from '@playwright/test'
import helper from '../playwright/helper.js'

const cstUrl = helper.getUrl("saisieScrutinCST")
const cstPrefUrl = cstUrl + helper.viewAsPref

test("CST : la page s'affiche", async ({ page }) => {
  await page.goto(cstPrefUrl)
  const iframeList = helper.getCustomWidget(page, 0)
  const iframeFiche = helper.getCustomWidget(page, 1)
  const iframeSaisie = helper.getCustomWidget(page, 2)
  await expect(iframeList.getByTestId('grist-container')).toBeAttached({ timeout: 15000 })
  await expect(iframeFiche.getByTestId('grist-container')).toBeAttached({ timeout: 15000 })
  await expect(iframeSaisie.getByTestId('grist-container')).toBeAttached({ timeout: 15000 })
})

test("CST : le nombre d'inscrit est enregistré", async ({ page }) => {
  await page.goto(cstPrefUrl)
  const iframeList = helper.getCustomWidget(page, 0)
  const iframeFiche = helper.getCustomWidget(page, 1)
  const iframeSaisie = helper.getCustomWidget(page, 2)
  // Sélectionne le 2ème scrutin de ma PREF
  await iframeList.getByTestId('recherche-item').nth(2).click()
  // Vérifie que la vue fiche est vide
  await expect(iframeFiche.getByTestId('fiche-tile')).toBeVisible({ timeout: 15000 })
  await expect(iframeFiche.getByTestId('fiche-content')).not.toBeVisible({ timeout: 15000 })
  // Je saisie les données
  const formIndexInscrits = 0
  await iframeSaisie.getByTestId('saisie-field-required').nth(formIndexInscrits).fill("100")
  await iframeSaisie.getByTestId('saisie-submit').click()
  // Je vérifie que la vue fiche est remplie
  await expect(iframeFiche.getByTestId('fiche-tile')).not.toBeVisible({ timeout: 15000 })
  await expect(iframeFiche.getByTestId('fiche-content')).toBeVisible({ timeout: 15000 })
  const ficheIndexInscrits = 1
  await expect(iframeFiche.getByTestId('fiche-field-value').nth(ficheIndexInscrits)).toContainText('100')
  // Je réinitialise les données
  await page.getByRole('button', { name: 'Undo' }).click()
})
