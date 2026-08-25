import { test, expect } from '@playwright/test'
import helper from '../playwright/helper.js'

const url = helper.getUrl("saisieScrutinCST")
const viewAsPrefs= helper.generatePrefViewAs(50)

test('il n\'y a pas de modale de maintenance', async ({ page }) => {
  await page.goto(url)
  await expect(page.getByText('Une maintenance de Grist est prévue')).not.toBeVisible({ timeout: 15000 })
})

test('peut saisir résultat scrutin CST', async ({ page }) => {
  // Va sur la page saisieScrutinCST
  const pageUrl = url + helper.viewAsPref
  await page.goto(pageUrl)
  // Récupération des iframes
  const iframeList = helper.getCustomWidget(page, 0)
  const iframeFiche = helper.getCustomWidget(page, 1)
  const iframeSaisie = helper.getCustomWidget(page, 2)
  // Vérification que les iframes sont attachés
  await expect(iframeList.getByTestId('grist-container')).toBeAttached({ timeout: 15000 })
  await expect(iframeFiche.getByTestId('grist-container')).toBeAttached({ timeout: 15000 })
  await expect(iframeSaisie.getByTestId('saisie-scrutin-formulaire')).toBeAttached({ timeout: 15000 })
  // Sélectionne le 2ème scrutin de ma PREF
  await iframeList.getByTestId('search-result-item').nth(2).click()
  // Vérifie que la vue fiche est vide
  await expect(iframeFiche.getByTestId('fiche-tile')).toBeVisible({ timeout: 15000 })
  await expect(iframeFiche.getByTestId('fiche-content')).not.toBeVisible({ timeout: 15000 })
  // Je saisie les données
  const formIndexStart = 0
  await iframeSaisie.getByTestId('saisie-scrutin-input').nth(formIndexStart).fill("100")
  await iframeSaisie.getByTestId('saisie-scrutin-submit').click()
  // Je vérifie que la vue fiche est remplie
  await expect(iframeFiche.getByTestId('fiche-tile')).not.toBeVisible({ timeout: 15000 })
  await expect(iframeFiche.getByTestId('fiche-content')).toBeVisible({ timeout: 15000 })
  const ficheIndexStart = 1
  await expect(iframeFiche.getByTestId('fiche-simple-value').nth(ficheIndexStart)).toHaveText('100')
  // Je réinitialise les données
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(iframeFiche.getByTestId('fiche-tile')).toBeVisible({ timeout: 15000 })
  await expect(iframeFiche.getByTestId('fiche-content')).not.toBeVisible({ timeout: 15000 })
})
  // Il n'y a pas d'erreur ? 
  // Quel est le temps de la durée de la saisie ? 
