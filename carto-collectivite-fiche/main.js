/* Imports */
import Modal from '../scripts/classes/Modal.js'

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
  if (tableColumnsInfos.length === 0) await getTableColumnsInfos()
})

/* COLUMNS */
const getTableColumnsInfos = async () => {
  if (tableColumnsInfos.length > 0) return
  const tableName = await grist.getSelectedTableId()
  const allTables = await grist.docApi.fetchTable('_grist_Tables')
  const tableId = allTables.id[allTables.tableId.indexOf(tableName)]
  const allGristColumns = await grist.docApi.fetchTable('_grist_Tables_column')
  let index = 0
  tableColumnsInfos = allGristColumns.parentId.reduce(function (
    filtered,
    currentValue
  ) {
    if (currentValue === tableId)
      filtered.push({
        label: allGristColumns.label[index],
        description: allGristColumns.description[index],
        colId: allGristColumns.colId[index],
        type: allGristColumns.type[index],
      })
    index++
    return filtered
  },
  [])
}

const getColumnInfos = (column) => {
  return tableColumnsInfos.filter((col) => col.colId === column)[0]
}

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
    const prettyValue = prettifyValue(currentRecord[dataMapped[i]])
    const prettyLabel = getColumnInfos(dataMapped[i]).label
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

const generateAlertError = (content) => {
  const li = document.createElement('li')
  li.classList.add('fr-alert', 'fr-alert--error')
  const p = document.createElement('p')
  p.classList.add('fr-alert__title')
  p.textContent = content
  li.appendChild(p)
  return li
}

// Delete
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
