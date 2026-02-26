/* IMPORTS */
import valuesUtils from '../scripts/utils/values.js'

/* VAR */
const inputElement = document.querySelector('#search-input')
const submitElement = document.querySelector('#submit')
const listElement = document.querySelector('#list')
const errorElement = document.querySelector('#error')

let allRecords = []
let columnSearchMapped = null
let columnBadgeMapped = null
let columnDescriptionMapped = null
let currentRecord = null

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
    {
      name: 'ColumnDescription',
      optional: true,
    },
  ],
})

grist.onRecords((table, mapping) => {
  // Les données dans la table ont changé.
  columnSearchMapped = mapping['ColumnSearch']
  columnBadgeMapped = mapping['ColumnBadge']
  columnDescriptionMapped = mapping['ColumnDescription']
  allRecords = table
  displayList()
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

/* DOM */
const displayList = () => {
  listElement.replaceChildren()
  errorElement.textContent = ''
  const value = inputElement.value.trim()
  if (value === '') {
    displayRows(allRecords)
  } else {
    const recordsFound = allRecords.filter((record) =>
      valuesUtils.isInString(record[columnSearchMapped], inputElement.value)
    )
    if (recordsFound.length > 0) displayRows(recordsFound)
    else noResults()
  }
}

const noResults = () => {
  errorElement.textContent = `Aucun résultat pour la recherche : "${inputElement.value}"`
}

/* DYNAMIC VIEW */
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

    if (rows[i][columnDescriptionMapped]) {
      const description = document.createElement('p')
      description.classList.add('fr-text--xs', 'fr-mb-0')
      description.textContent = rows[i][columnDescriptionMapped]
      divName.appendChild(description)
    }

    divRow.appendChild(divName)

    if (columnBadgeMapped) {
      const divBadge = document.createElement('div')
      divBadge.classList.add('fr-col-6', 'fr-grid-row', 'fr-grid-row--right')
      const badge = document.createElement('p')
      const status = rows[i][columnBadgeMapped].toLowerCase()
      badge.classList.add('fr-badge')
      badge.textContent = status
      if (['complet', 'validé'].includes(status))
        badge.classList.add('fr-badge--success')
      else if (['incomplet', 'doublon', 'à valider'].includes(status))
        badge.classList.add('fr-badge--error')
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

    listElement.appendChild(li)
    li.addEventListener('click', () => {
      grist.setCursorPos({ rowId: id })
    })
  }
}

/* SEARCH */
submitElement.addEventListener('click', () => {
  displayList()
  selectRow(currentRecord.id)
})
