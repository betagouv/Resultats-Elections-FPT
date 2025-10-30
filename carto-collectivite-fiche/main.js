/* IMPORTS */
import Modal from '../scripts/classes/Modal.js'
import gristUtils from '../scripts/utils/grist.js'

/* VAR */
const emptyElement = document.querySelector('#empty')
const filledElement = document.querySelector('#filled')
const titleElement = document.querySelector('#title')
const badgeElement = document.querySelector('#badge')
const dataElement = document.querySelector('#data')
const errorsElement = document.querySelector('#errors')
const deleteElement = document.querySelector('#delete')
const modal = new Modal({
  container: document.querySelector('#section-modal'),
})

let titleMapped = null
let badgeMapped = null
let dataMapped = null
let errorsMapped = null
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
}

const resetCard = () => {
  dataElement.innerHTML = ''
  errorsElement.innerHTML = ''
}

const fillCard = () => {
  // Badge
  const status = currentRecord[badgeMapped]
  badgeElement.classList.remove('fr-badge--error')
  badgeElement.classList.remove('fr-badge--success')
  badgeElement.textContent = currentRecord[badgeMapped]
  if (status === 'Complet') badgeElement.classList.add('fr-badge--success')
  else if (status === 'Incomplet') badgeElement.classList.add('fr-badge--error')

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
    const prettyValue = prettifyValue(currentRecord[dataMapped[i]])
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

const prettifyValue = (value) => {
  if (value === true) return 'oui'
  if (value === false) return 'non'
  if (value === null) return 'non renseigné'
  return value
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

/* DELETE */
deleteElement.addEventListener('click', async () => {
  deleteElement.setAttribute('disabled', true)
  const deleteElementContent = deleteElement.textContent
  deleteElement.textContent = 'Suppression en cours'
  try {
    await grist.selectedTable.destroy(currentRecord.id)
    modal.closeDialog()
    deleteElement.removeAttribute('disabled')
    deleteElement.textContent = deleteElementContent
  } catch (e) {
    console.error('error', e)
  }
})

/* COLUMNS INFOS */
const needsColumnInfos = async () => {
  if (tableColumnsInfos.length === 0) {
    tableColumnsInfos = await gristUtils.getTableColumnsInfos()
  }
}
