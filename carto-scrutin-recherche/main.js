/* IMPORTS */
import Modal from '../scripts/classes/Modal.js'
import valuesUtils from '../scripts/utils/values.js'

/* VAR */
const inputElement = document.querySelector('#search-input')
const submitElement = document.querySelector('#submit')
const listElement = document.querySelector('#list')
const errorElement = document.querySelector('#error')
const searchAddInput = document.querySelector('#search-add-input')
const searchAddButton = document.querySelector('#search-add-button')
const searchAddLoading = document.querySelector('#search-add-loading')
const searchAddEmpty = document.querySelector('#search-add-empty')
const searchAddResults = document.querySelector('#search-add-results')
const searchAddClose = document.querySelector('#search-add-close')
const searchCreateButton = document.querySelector('#search-create-button')
new Modal({
  container: document.querySelector('#section-modal'),
})

let allRecords = []
let columnSearchMapped = null
let columnBadgeMapped = null
let columnOrganisateurMapped = null
let columnRattacheesMapped = null
let columnDescriptionMapped = null
let currentRecord = null
let allCollectivites = []
let organisateurId = null
let setCursorFromClick = false
let isFirstTime = true
let scrutinName = null

/* GRIST */
grist.ready({
  requiredAccess: 'full',
  allowSelectBy: true,
  columns: [
    {
      name: 'ColumnSearch',
      description: 'Champ de recherche',
    },
    {
      name: 'ColumnOrganisateur',
      description: 'Colonne organisateur du scrutin',
    },
    {
      name: 'ColumnRattachees',
      description: 'Colonne collectivités rattachées',
    },
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

grist.onRecords(async (table, mapping) => {
  // Les données dans la table ont changé.
  columnSearchMapped = mapping['ColumnSearch']
  columnBadgeMapped = mapping['ColumnBadge']
  columnOrganisateurMapped = mapping['ColumnOrganisateur']
  columnRattacheesMapped = mapping['ColumnRattachees']
  columnDescriptionMapped = mapping['ColumnDescription']
  allRecords = table
  await setScrutinName()
  displayList()
})

grist.onRecord((record) => {
  // Le curseur a été déplacé.
  currentRecord = record
  selectRow(currentRecord.id)
  if (!setCursorFromClick && !isFirstTime) {
    const selectedRow = document.querySelector('.selected')
    selectedRow.scrollIntoView()
  }
  isFirstTime = false
  setCursorFromClick = false
})

/* COLUMNS */
const setScrutinName = async () => {
  const tableId = await grist.getSelectedTableId()
  scrutinName = tableId.split('_').pop()
}

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
      valuesUtils.doesContain(record[columnSearchMapped], inputElement.value)
    )
    if (recordsFound.length > 0) displayRows(recordsFound)
    else noResults()
  }
}

const noResults = () => {
  errorElement.textContent = `Aucun résultat pour la recherche : "${inputElement.value}"`
}


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
      const status = rows[i][columnBadgeMapped]
      badge.classList.add('fr-badge')
      badge.textContent = status
      if (status === 'Complet') badge.classList.add('fr-badge--success')
      else if (status === 'Incomplet' || status === 'Doublon')
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
      setCursorFromClick = true
      grist.setCursorPos({ rowId: id })
    })
  }
}

/* SEARCH */
submitElement.addEventListener('click', () => {
  displayList()
  selectRow(currentRecord.id)
})

/* MODAL */
const displaySearchResults = (results) => {
  for (let i = 0; i < results.length; i++) {
    const infos = getCollectiviteInfos(results[i])
    const radio = createRadio(infos)
    searchAddResults.appendChild(radio)
  }
}

const getCollectiviteInfos = (name) => {
  const index = allCollectivites.Nom_complet.indexOf(name)
  const organisateurColumnName = `${scrutinName}_Organisateur`
  const scrutinColumnName = `Scrutin_${scrutinName}`
  const scrutinAlreadyLinked = allCollectivites[scrutinColumnName][index]
  return {
    value: allCollectivites.id[index],
    name: allCollectivites.Nom_complet[index],
    isOrganisor: allCollectivites[organisateurColumnName][index],
    scrutinAlreadyLinked:
      typeof scrutinAlreadyLinked === 'string'
        ? [scrutinAlreadyLinked]
        : scrutinAlreadyLinked,
  }
}

const createRadio = (props) => {
  const { value, name, isOrganisor, scrutinAlreadyLinked } = props
  const radio = document.createElement('div')
  radio.classList.add('fr-radio-group', 'fr-mb-1w')
  const input = document.createElement('input')
  input.setAttribute('type', 'radio')
  input.setAttribute('value', value)
  input.setAttribute('id', value)
  input.setAttribute('name', 'organisateur')
  const label = document.createElement('label')
  label.setAttribute('for', value)
  label.textContent = name
  if (isOrganisor) {
    input.setAttribute('disabled', true)
    const span = document.createElement('span')
    span.textContent = `La collectivité organise déjà un scrutin ${scrutinName}`
    span.classList.add('fr-hint-text')
    label.appendChild(span)
  } else if (scrutinAlreadyLinked.length === 1 && scrutinName !== 'CAP') {
    input.setAttribute('disabled', true)
    const span = document.createElement('span')
    span.textContent = `La collectivité est rattachée au scrutin ${scrutinName} de ${scrutinAlreadyLinked}, pour en créer un en tant qu'organisatrice vous devez d'abord la détacher de ce dernier.`
    span.classList.add('fr-hint-text')
    label.appendChild(span)
  } else if (scrutinAlreadyLinked.length > 1 && scrutinName === 'CAP') {
    const span = document.createElement('span')
    const scrutinAlreadyLinkedClean = scrutinAlreadyLinked.slice(1) // HACK first value is "L"
    const scrutinName =
      scrutinAlreadyLinkedClean.length > 1 ? 'aux scrutins' : 'au scrutin'
    const scrutinList = scrutinAlreadyLinkedClean.join(', ')
    span.textContent = `La collectivité est déjà rattachée ${scrutinName} : ${scrutinList}`
    span.classList.add('fr-hint-text')
    label.appendChild(span)
  }
  radio.appendChild(input)
  radio.appendChild(label)
  return radio
}

const resetAddSearch = () => {
  searchAddEmpty.classList.add('fr-hidden')
  searchAddLoading.classList.add('fr-hidden')
  searchCreateButton.classList.add('fr-hidden')
  searchAddResults.replaceChildren()
}

searchAddButton.addEventListener('click', async () => {
  resetAddSearch()
  const searchValue = searchAddInput.value.toLowerCase().trim()
  if (searchValue.length === 0) return
  searchAddLoading.classList.remove('fr-hidden')
  allCollectivites = await grist.docApi.fetchTable('Collectivites')
  const filteredCollectivites = allCollectivites.Nom_complet.filter((name) => {
    if (typeof name !== 'string') return false
    const nameLower = name.toLowerCase()
    return nameLower.indexOf(searchValue) === 0
  })
  searchAddLoading.classList.add('fr-hidden')
  if (filteredCollectivites.length === 0)
    searchAddEmpty.classList.remove('fr-hidden')
  else displaySearchResults(filteredCollectivites)
})

searchAddClose.addEventListener('click', () => {
  resetAddSearch()
  searchAddInput.value = ''
})

searchAddResults.addEventListener('change', () => {
  const formData = new FormData(searchAddResults)
  organisateurId = formData.get('organisateur')
  if (organisateurId !== null) searchCreateButton.classList.remove('fr-hidden')
})

/* MODAL */
searchCreateButton.addEventListener('click', async () => {
  const searchCreateButtonText = searchCreateButton.textContent
  searchCreateButton.textContent = 'Création en cours'
  searchCreateButton.setAttribute('disabled', true)
  const id = Number(organisateurId)
  const action = [
    'AddRecord',
    `Scrutins_${scrutinName}`,
    null,
    {
      [columnOrganisateurMapped]: id,
      [columnRattacheesMapped]: `[${id}]`,
    },
  ]
  const actions = [action]
  const newRecord = await grist.docApi.applyUserActions(actions)

  searchCreateButton.textContent = searchCreateButtonText
  searchCreateButton.setAttribute('disabled', false)

  if (newRecord.retValues.length > 0) {
    isNew = true
    const newRecordId = newRecord.retValues[0]
    searchAddClose.click()
    grist.setCursorPos({ rowId: newRecordId })
  } else {
    resetAddSearch()
    console.error('Une erreur est survenue lors de la création du scrutin')
  }
})
