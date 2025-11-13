/* VAR */
const inputElement = document.querySelector('#search-input')
const submitElement = document.querySelector('#submit')
const listElement = document.querySelector('#list')
const errorElement = document.querySelector('#error')

let allRecords = []
let columnSearchMapped = null
let columnBadgeMapped = null
let currentRecord = null
let tableColumnsInfos = []

/* GRIST */
grist.ready({
  requiredAccess: 'full',
  allowSelectBy: true,
  columns: ['ColumnSearch', 'ColumnBadge'],
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
  listElement.innerHTML = ''
  errorElement.innerHTML = ''
  if (inputElement.value === '') {
    displayRows(allRecords)
    selectRow(currentRecord.id)
  } else {
    const recordsFound = allRecords.filter((record) => {
      const valueClean = inputElement.value.toLowerCase()
      const name = record[columnSearchMapped].toLowerCase()
      return name.indexOf(valueClean) >= 0
    })
    if (recordsFound.length > 0) displayRows(recordsFound)
    else noResults()
  }
}

const noResults = () => {
  errorElement.innerHTML = `Aucun résultat pour la recherche : "${inputElement.value}"`
}

inputElement.addEventListener('input', search)
submitElement.addEventListener('click', search)

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

    const divBadge = document.createElement('div')
    divBadge.classList.add('fr-col-6', 'fr-grid-row', 'fr-grid-row--right')
    const badge = document.createElement('p')
    const status = rows[i][columnBadgeMapped]
    badge.classList.add('fr-badge')
    badge.textContent = status
    if (status === 'Complet') badge.classList.add('fr-badge--success')
    else if (status === 'Incomplet') badge.classList.add('fr-badge--error')
    divBadge.appendChild(badge)

    divRow.appendChild(divName)
    divRow.appendChild(divBadge)

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
