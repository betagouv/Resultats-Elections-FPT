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
