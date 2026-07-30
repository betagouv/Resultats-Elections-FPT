/* IMPORTS */
import valuesUtils from '../scripts/utils/values.js'
import gristUtils from '../scripts/utils/grist.js'

/* VAR */
const searchAddInput = document.querySelector('#search-add-input')
const searchAddButton = document.querySelector('#search-add-button')
const searchAddLoading = document.querySelector('#search-add-loading')
const searchAddEmpty = document.querySelector('#search-add-empty')
const searchAddResults = document.querySelector('#search-add-results')
const searchCreateButton = document.querySelector('#search-create-button')

let columnOrganisateurMapped = null
let columnRattacheesMapped = null
let allCollectivites = []
let organisateurId = null
let scrutinName = null

/* GRIST */
grist.ready({
  requiredAccess: 'full',
  columns: [
    {
      name: 'ColumnOrganisateur',
      description: 'Colonne organisateur du scrutin',
    },
    {
      name: 'ColumnRattachees',
      description: 'Colonne collectivités rattachées',
    },
  ],
})

grist.onRecords(async (table, mapping) => {
  columnOrganisateurMapped = mapping['ColumnOrganisateur']
  columnRattacheesMapped = mapping['ColumnRattachees']
  await setScrutinName()
})

/* COLUMNS */
const setScrutinName = async () => {
  const tableId = await gristUtils.getCurrentTableID()
  scrutinName = tableId.split('_').pop()
}

/* SEARCH */
const displaySearchResults = (results) => {
  for (let i = 0; i < results.length; i++) {
    const infos = getCollectiviteInfos(results[i])
    const radio = createRadio(infos)
    searchAddResults.appendChild(radio)
  }
}

const getCollectiviteInfos = (name) => {
  const index = allCollectivites.Nom_de_collectivite_AFFICHE.indexOf(name)
  const isCAP = scrutinName === 'CAP'
  const scrutinColumn = `Scrutin_${scrutinName}`
  const organisorColumnName = `${scrutinColumn}_Organisateur`
  const scrutinAlreadyLinkedColumnName = `Scrutin_${scrutinName}_Nom`
  const scrutinAlreadyLinked = allCollectivites[scrutinAlreadyLinkedColumnName][index]
  return {
    value: allCollectivites.id[index],
    name: allCollectivites.Nom_de_collectivite_AFFICHE[index],
    isOrganisor: allCollectivites[organisorColumnName][index],
    scrutinAlreadyLinked: scrutinAlreadyLinked,
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
  if (isOrganisor && scrutinName !== 'CAP') {
    input.setAttribute('disabled', true)
    const span = document.createElement('span')
    span.textContent = `La collectivité organise déjà un scrutin ${scrutinName}`
    span.classList.add('fr-hint-text')
    label.appendChild(span)
  }
  else if (scrutinAlreadyLinked && scrutinName !== 'CAP') {
    input.setAttribute('disabled', true)
    const span = document.createElement('span')
    span.textContent = `La collectivité est déjà rattachée au ${scrutinAlreadyLinked}, pour en créer un en tant qu'organisatrice vous devez d'abord la détacher de ce dernier.`
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
  allCollectivites = await grist.docApi.fetchTable('Table_collectivites')
  const filteredCollectivites = allCollectivites.Nom_de_collectivite_AFFICHE.filter((name) => valuesUtils.isInString(name, searchValue))
  searchAddLoading.classList.add('fr-hidden')
  if (filteredCollectivites.length === 0)
    searchAddEmpty.classList.remove('fr-hidden')
  else displaySearchResults(filteredCollectivites)
})

searchAddResults.addEventListener('change', () => {
  const formData = new FormData(searchAddResults)
  organisateurId = formData.get('organisateur')
  if (organisateurId !== null) searchCreateButton.classList.remove('fr-hidden')
})

searchCreateButton.addEventListener('click', async () => {
  const searchCreateButtonText = searchCreateButton.textContent
  searchCreateButton.textContent = 'Création en cours'
  searchCreateButton.setAttribute('disabled', true)
  const id = Number(organisateurId)
  const action = [
    'AddRecord',
    `Table_scrutins_${scrutinName}`,
    null,
    {
      [columnOrganisateurMapped]: id,
      [columnRattacheesMapped]: `[${id}]`,
    },
  ]
  const actions = [action]
  const newRecord = await grist.docApi.applyUserActions(actions)

  searchCreateButton.textContent = searchCreateButtonText
  searchCreateButton.removeAttribute('disabled')

  if (newRecord.retValues.length > 0) {
    const newRecordId = newRecord.retValues[0]
    resetAddSearch()
    searchAddInput.value = ''
    grist.setCursorPos({ rowId: newRecordId })
  } else {
    resetAddSearch()
    console.error('Une erreur est survenue lors de la création du scrutin')
  }
})
