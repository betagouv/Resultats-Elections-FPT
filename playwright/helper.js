import grist from './grist.js'
const viewAsPref = "?aclAsUser_=dgcl.test.pref%40beta.gouv.fr"
const viewAsAdmin = "?aclAsUser_=dgcl.test.admin%40beta.gouv.fr"

const getUrl = (page) => `https://grist.numerique.gouv.fr/o/dgcl/${grist.docID}/${grist.docName}/p/${grist.pagesID[page]}`
const getWidgetHtmlBuilder = (page, number) => page.locator('iframe').contentFrame().locator('iframe').contentFrame()

export default { getUrl, getWidgetHtmlBuilder, viewAsPref, viewAsAdmin }