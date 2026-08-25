import grist from './grist.js'
const viewAsPref = "?aclAsUser_=dgcl.test.pref%40beta.gouv.fr"
const viewAsAdmin = "?aclAsUser_=dgcl.test.admin%40beta.gouv.fr"

const getUrl = (page) => `https://grist.numerique.gouv.fr/o/dgcl/${grist.docID}/${grist.docName}/p/${grist.pagesID[page]}`
const getWidgetHtmlBuilder = (page, number) => page.locator('iframe').contentFrame().locator('iframe').contentFrame()
const getCustomWidget = (page, number) => page.locator('iframe').nth(number || 0).contentFrame()

const generatePrefViewAs = (number) => {
  const users = []
  for (let i = 0; i < number; i++) {
    users.push(`?aclAsUser_=dgcl.test.pref-${i}%40beta.gouv.fr`)
  }
  return users
}

export default { getUrl, getWidgetHtmlBuilder, getCustomWidget, generatePrefViewAs, viewAsPref, viewAsAdmin }