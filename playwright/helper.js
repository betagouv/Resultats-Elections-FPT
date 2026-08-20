const docId = process.env.GRIST_DOC_ID
const viewAsPref = "?aclAsUser_=dgcl.test.pref%40beta.gouv.fr"
const viewAsAdmin = "?aclAsUser_=dgcl.test.admin%40beta.gouv.fr"

const pagesID = {
  "accueil": "10"
}

const getUrl = (page) => {
  return `https://grist.numerique.gouv.fr/o/dgcl/${docId}/p/${pagesID[page]}`
}

export default { getUrl, viewAsPref, viewAsAdmin }