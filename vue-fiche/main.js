/* IMPORTS */
import gristUtils from '../scripts/utils/grist.js'
import valuesUtils from '../scripts/utils/values.js'
import Modal from '../scripts/classes/Modal.js'

/* VAR */
const emptyCardElement = document.querySelector('[data-js="card-empty"]')
const filledCardElement = document.querySelector('[data-js="card-filled"]')
const titleElements = document.querySelectorAll('[data-js="title"]')
const badgeElement = document.querySelector('[data-js="badge"]')
const dataElement = document.querySelector('[data-js="data"]')
const errorsElement = document.querySelector('[data-js="errors"]')
const modalElement = document.querySelector('[data-js="modal"]')
const modalSubmitElement = modalElement.querySelector('#submit')
const modalButtonElement = modalElement.querySelector('[data-js="modal-button"]')
const modalTitleElement = modalElement.querySelector('[data-js="modal-title"]')
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
  fillTitle()
  if (status === 'À renseigner') {
    filledCardElement.classList.add('fr-hidden')
    emptyCardElement.classList.remove('fr-hidden')
  } else {
    fillCard()
    filledCardElement.classList.remove('fr-hidden')
    emptyCardElement.classList.add('fr-hidden')
  }

  // Action
  if (actionMapped) {
    // Créer un bouton
    modalButtonElement.textContent = currentRecord[actionMapped].button
    modalTitleElement.textContent = currentRecord[actionMapped].description
    modalElement.classList.remove('fr-hidden')
    // Active un bouton ou non
    if (currentRecord[actionMapped].isDisabled) {
      modalSubmitElement.classList.add('fr-hidden')
    } else {
      modalSubmitElement.classList.remove('fr-hidden')
    }
  }
}

const resetCard = () => {
  dataElement.replaceChildren()
  errorsElement.replaceChildren()
}

const fillTitle = () => {
  titleElements.forEach(title => {
    title.textContent = currentRecord[titleMapped]
  })
}

const fillCard = () => {

  // Badge
  const status = currentRecord[badgeMapped].toLowerCase()
  badgeElement.classList.remove('fr-badge--error')
  badgeElement.classList.remove('fr-badge--success')
  badgeElement.textContent = status
  if (['complet', 'validé'].includes(status))
    badgeElement.classList.add('fr-badge--success')
  else if (['incomplet', 'doublon', 'à valider'].includes(status))
    badgeElement.classList.add('fr-badge--error')


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

modalSubmitElement.addEventListener('click', () => {
  submitAction([currentRecord[actionMapped].action])
})

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
