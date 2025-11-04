/* IMPORTS */
import Modal from '../scripts/classes/Modal.js'
import gristUtils from '../scripts/utils/grist.js'
import valuesUtils from '../scripts/utils/values.js'

/* SETUP */
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
grist.onRecord((record) => {
  // Le curseur s'est déplacé
  currentRecord = record
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
  else if (status === 'Incomplet' || status === 'Doublon')
    badgeElement.classList.add('fr-badge--error')

  // Titre
  if (titleElement) {
    titleElement.textContent = currentRecord[titleMapped]
  }

  // Informations
  for (let i = 0; i < dataMapped.length; i++) {
    const li = document.createElement('li')
    const p = document.createElement('p')
    const list = document.createElement('ul')
    p.classList.add('fr-mb-1v')
    const prettyValue = valuesUtils.prettify(currentRecord[dataMapped[i]])
    const prettyLabel = gristUtils.getColumnInfos(dataMapped[i]).label
    p.textContent = `${prettyLabel} : `
    if (typeof prettyValue === 'object') {
      const orderAlphabetically = prettyValue.sort((a, b) => a.localeCompare(b))
      for (let i = 0; i < orderAlphabetically.length; i++) {
        const element = document.createElement('li')
        const p = document.createElement('p')
        p.textContent = orderAlphabetically[i]
        p.classList.add('fr-mb-0')
        element.appendChild(p)
        list.appendChild(element)
      }
    } else {
      p.textContent += ` ${prettyValue}`
    }
    li.appendChild(p)
    li.appendChild(list)

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
    console.warn('error', e)
  }
})


/* COLUMNS INFOS */
const needsColumnInfos = async () => {
  if (tableColumnsInfos.length === 0) {
    tableColumnsInfos = await gristUtils.getTableColumnsInfos()
  }
}
