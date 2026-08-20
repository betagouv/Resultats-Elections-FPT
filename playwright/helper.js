const docId = process.env.GRIST_DOC_ID
const viewAsPref = "?aclAsUser_=dgcl.test.pref%40beta.gouv.fr"
const viewAsAdmin = "?aclAsUser_=dgcl.test.admin%40beta.gouv.fr"

const pagesID = {
  "accueil": "10"
}

const getUrl = (page) => {
  return `https://grist.numerique.gouv.fr/o/dgcl/${docId}/p/${pagesID[page]}`
}

const getWidget = (page) => {
  return page.locator('iframe').contentFrame().locator('iframe').contentFrame()
}

export default { getUrl, getWidget, viewAsPref, viewAsAdmin }