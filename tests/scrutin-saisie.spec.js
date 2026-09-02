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

test("CST : la deuxième collectivité est à renseigner", async ({ page }) => {
  await page.goto(cstPrefUrl)
  const iframeList = helper.getCustomWidget(page, 0)
  const iframeFiche = helper.getCustomWidget(page, 1)
  const iframeSaisie = helper.getCustomWidget(page, 2)
  // Sélectionne le 2ème scrutin de ma PREF
  await iframeList.getByTestId('recherche-item').nth(2).click()
  // Vérifie que la vue fiche est vide
  await expect(iframeFiche.getByTestId('fiche-tile')).toBeVisible({ timeout: 15000 })
  await expect(iframeFiche.getByTestId('fiche-content')).not.toBeVisible({ timeout: 15000 })
})

test("CST : le nombre d'inscrit est enregistré", async ({ page }) => {
  await page.goto(cstPrefUrl)
  const iframeList = helper.getCustomWidget(page, 0)
  const iframeFiche = helper.getCustomWidget(page, 1)
  const iframeSaisie = helper.getCustomWidget(page, 2)
  await iframeList.getByTestId('recherche-item').nth(2).click()
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

test("CST : l'absence de candidat désactive les champs et est enregistrée", async ({ page }) => {
  await page.goto(cstPrefUrl)
  const iframeList = helper.getCustomWidget(page, 0)
  const iframeFiche = helper.getCustomWidget(page, 1)
  const iframeSaisie = helper.getCustomWidget(page, 2)
  await iframeList.getByTestId('recherche-item').nth(2).click()
  // Je vérifie les champs des deux groupes sont saisissables
  const groupsFields = iframeSaisie.getByTestId('saisie-field-firstGroup').or(iframeSaisie.getByTestId('saisie-field-secondGroup'))
  await expect(groupsFields.first()).toBeEnabled({ timeout: 15000 })
  // Je saisie le nombre d'inscrits qui reste obligatoire
  const formIndexInscrits = 0
  await iframeSaisie.getByTestId('saisie-field-required').nth(formIndexInscrits).fill("100")
  // Je coche "Absence de candidat"
  // force: true car l'input DSFR est masqué sous son label qui intercepte le clic
  const formIndexAbsenceCandidat = 1
  await iframeSaisie.getByTestId('saisie-field-required').nth(formIndexAbsenceCandidat).check({ force: true })
  // Je vérifie que tous les champs des deux groupes sont désactivés
  for (const field of await groupsFields.all()) {
    await expect(field).toBeDisabled()
  }
  // Enregistre les données
  await iframeSaisie.getByTestId('saisie-submit').click()
  // Je vérifie que la vue fiche affiche l'absence de candidat
  await expect(iframeFiche.getByTestId('fiche-content')).toBeVisible({ timeout: 15000 })
  await expect(iframeFiche.getByTestId('fiche-field-value').nth(2)).toContainText('oui')
  // Je réinitialise les données
  await page.getByRole('button', { name: 'Undo' }).click()
})
