/* IMPORTS */
import gristUtils from '../scripts/utils/grist.js'
import valuesUtils from '../scripts/utils/values.js'
import Modal from '../scripts/classes/Modal.js'

/* VAR */
const emptyElement = document.querySelector('#empty')
const filledElement = document.querySelector('#filled')
const titleElement = document.querySelector('#title')
const badgeElement = document.querySelector('#badge')
const dataElement = document.querySelector('#data')
const errorsElement = document.querySelector('#errors')
const modalElement = document.querySelector('#modal')
const actionButton = modalElement.querySelector('#action-name')
const actionDescription = modalElement.querySelector('#action-title')
const modal = new Modal({
  container: modalElement,
})

let titleMapped = null
let badgeMapped = null
let dataMapped = null
let errorsMapped = null
let actionMapped = null
let currentRecord = null
let tableColumnsInfos = []
let actionSubmit = null

/* GRIST */
grist.ready({
  requiredAccess: 'full',
  columns: [
    {
      name: 'title',
      description: 'Titre de ma carte',
    },
    {
      name: 'badge',
      description: 'Badge',
      optional: true,
    },
    {
      name: 'data',
      description: 'Données saisies',
      allowMultiple: true,
    },
    {
      name: 'errors',
      description: 'Contrôles de cohérences',
      allowMultiple: true,
      optional: true,
    },
    {
      name: 'action',
      description: 'Action',
      optional: true,
    },
  ],
})

grist.onRecord(async (record) => {
  // Le curseur s'est déplacé
  currentRecord = record
  await needsColumnInfos()
  displayContent()
  window.scrollTo(0, 0)
})

grist.onRecords(async (table, mapping) => {
  // Les données dans la table ont changé.
  titleMapped = mapping['title']
  badgeMapped = mapping['badge']
  dataMapped = mapping['data']
  errorsMapped = mapping['errors']
  actionMapped = mapping['action']
  await needsColumnInfos()
})

/* CONTENT */
const displayContent = () => {
  resetCard()
  const status = currentRecord[badgeMapped]
  if (status === 'À renseigner') {
    filledElement.classList.add('fr-hidden')
    emptyElement.classList.remove('fr-hidden')
  } else {
    fillCard()
    filledElement.classList.remove('fr-hidden')
    emptyElement.classList.add('fr-hidden')
  }

  // Action
  if (actionMapped) {
    // Créer un bouton
    actionButton.textContent = currentRecord[actionMapped].button
    actionDescription.textContent = currentRecord[actionMapped].description
    modalElement.classList.remove('fr-hidden')
    actionSubmit = modalElement.querySelector('#submit')
    // Active un bouton ou non
    if (currentRecord[actionMapped].isDisabled) {
      actionSubmit.classList.add('fr-hidden')
    } else {
      actionSubmit.classList.remove('fr-hidden')
      actionSubmit.addEventListener('click', () => {
        submitAction([currentRecord[actionMapped].action])
      })
    }
  }
}

const resetCard = () => {
  dataElement.replaceChildren()
  errorsElement.replaceChildren()
}

const fillCard = () => {
  // Badge
  const status = currentRecord[badgeMapped]
  badgeElement.classList.remove('fr-badge--error')
  badgeElement.classList.remove('fr-badge--success')
  badgeElement.textContent = currentRecord[badgeMapped]
  if (status === 'Complet' || status.indexOf('validé') >= 0)
    badgeElement.classList.add('fr-badge--success')
  else if (status === 'Incomplet' || status.indexOf('valider') >= 0)
    badgeElement.classList.add('fr-badge--error')

  // Titre
  if (titleElement) {
    titleElement.textContent = currentRecord[titleMapped]
  }

  // Informations
  for (let i = 0; i < dataMapped.length; i++) {
    const li = document.createElement('li')
    const p = document.createElement('p')
    p.classList.add('fr-mb-1v')
    const columnInfos = gristUtils.getColumnInfos(
      dataMapped[i],
      tableColumnsInfos
    )
    const prettyValue = valuesUtils.prettify(currentRecord[dataMapped[i]])
    const prettyLabel = columnInfos.label
    p.textContent = `${prettyLabel} : ${prettyValue}`
    li.appendChild(p)
    dataElement.appendChild(li)
  }

  // Erreurs
  for (let i = 0; i < errorsMapped.length; i++) {
    const error = currentRecord[errorsMapped[i]]
    if (!error) continue
    const alertError = generateAlertError(error)
    errorsElement.appendChild(alertError)
  }
}

/* ACTION */
const submitAction = async (actions) => {
  const updatedRecord = await grist.docApi.applyUserActions(actions)
  if (updatedRecord) modal.closeDialog()
}

/* ERROR */
const generateAlertError = (content) => {
  const li = document.createElement('li')
  li.classList.add('fr-alert', 'fr-alert--error')
  const p = document.createElement('p')
  p.classList.add('fr-alert__title')
  p.textContent = content
  li.appendChild(p)
  return li
}

/* COLUMNS INFOS */
const needsColumnInfos = async () => {
  if (tableColumnsInfos.length === 0) {
    tableColumnsInfos = await gristUtils.getTableColumnsInfos()
  }
}
