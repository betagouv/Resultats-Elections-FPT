/* UTILS */
import searchUtils from '../scripts/search.js'
import Configuration from '../scripts/configuration.js'
import Modal from '../scripts/modal.js'

/* VAR */
const inputElement = document.querySelector('#search-input')
const submitElement = document.querySelector('#submit')
const listElement = document.querySelector('#list')
const errorElement = document.querySelector('#error')
const iframeElement = document.querySelector('#iframe')
new Modal({
  container: document.querySelector('section'),
})

let allRecords = []
let columnSearchMapped = null
let columnBadgeMapped = null
let currentRecord = null
let configuration = null

/* GRIST */
grist.ready({
  requiredAccess: 'full',
  allowSelectBy: true,
  columns: [
    'ColumnSearch',
    {
      name: 'ColumnBadge',
      optional: true,
    },
  ],
  onEditOptions: () => {
    // On clic sur "Ouvrir la configuration"
    if (configuration) configuration.open()
  },
})

grist.onRecords((table, mapping) => {
  // Les données dans la table ont changé.
  columnSearchMapped = mapping['ColumnSearch']
  columnBadgeMapped = mapping['ColumnBadge']
  allRecords = table
  search()
})

grist.onRecord((record) => {
  // Le curseur a été déplacé.
  currentRecord = record
  selectRow(currentRecord.id)
})

/* SELECT ROW */
const selectRow = (id) => {
  const previousSelected = document.querySelector('.selected')
  if (previousSelected) previousSelected.classList.remove('selected')
  const newSelected = document.querySelector(`[data-row-id="${id}"]`)
  if (newSelected) newSelected.classList.add('selected')
}

/* SEARCH */
const search = () => {
  listElement.replaceChildren()
  errorElement.textContent = ''
  const value = inputElement.value.trim()
  if (value === '') {
    displayRows(allRecords)
    selectRow(currentRecord.id)
  } else {
    const recordsFound = allRecords.filter((record) =>
      searchUtils.containsValue(record[columnSearchMapped], inputElement.value)
    )
    if (recordsFound.length > 0) displayRows(recordsFound)
    else noResults()
  }
}

const noResults = () => {
  errorElement.textContent = `Aucun résultat pour la recherche : "${inputElement.value}"`
}

/* DOM */
const displayRows = (rows) => {
  for (let i = 0; i < rows.length; i++) {
    const divRow = document.createElement('button')
    divRow.classList.add('fr-grid-row', 'fr-grid-row--gutters')

    const id = rows[i].id
    const divTop = document.createElement('div')
    divTop.classList.add(
      'fr-mb-1',
      'fr-grid-row',
      'fr-grid-row--gutters',
      'fr-grid-row--top'
    )

    const divName = document.createElement('div')
    divName.classList.add('fr-col-6')
    const p = document.createElement('p')
    p.textContent = rows[i][columnSearchMapped]
    p.classList.add('fr-mb-0')
    divName.appendChild(p)
    divRow.appendChild(divName)

    if (columnBadgeMapped) {
      const divBadge = document.createElement('div')
      divBadge.classList.add('fr-col-6', 'fr-grid-row', 'fr-grid-row--right')
      const badge = document.createElement('p')
      const status = rows[i][columnBadgeMapped]
      badge.classList.add('fr-badge')
      badge.textContent = status
      if (status === 'Complet') badge.classList.add('fr-badge--success')
      else if (status === 'Incomplet') badge.classList.add('fr-badge--error')
      divBadge.appendChild(badge)
      divRow.appendChild(divBadge)
    } else {
      divName.classList.remove('fr-col-6')
      divName.classList.add('fr-col-12')
    }

    const li = document.createElement('li')
    li.classList.add('fr-card', 'fr-p-1w', 'fr-my-1w')
    li.appendChild(divRow)
    li.setAttribute('data-row-id', id)
    li.addEventListener('click', () => {
      grist.setCursorPos({ rowId: id })
    })

    listElement.appendChild(li)
  }
}

/* EVENTS */
submitElement.addEventListener('click', search)

/* CONFIGURATION */
const setupConfiguration = () => {
  configuration = new Configuration({
    name: 'iframe-url-create-collectivite',
    label: 'Url du formulaire de création collectivité',
    onClose: () => {
      updateIframeSrc()
    },
  })
  updateIframeSrc()
}

const updateIframeSrc = async () => {
  const url = await configuration.getValue()
  iframeElement.src = url
}

setupConfiguration()
