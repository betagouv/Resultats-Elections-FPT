/* SETUP */
grist.ready({
  requiredAccess: 'full',
  columns: [
    {
      name: 'Name',
      description: 'Nom de la collectivite',
    },
    {
      name: 'RefIds',
      description: 'Identifiant',
    },
    {
      name: 'RefNames',
      description: 'Nom',
    },
  ],
})

/* VAR */
const namesElement = document.querySelectorAll('[data-name="collectivite"]')
const formElement = document.querySelector('#form')
const checkboxesElement = document.querySelector('#checkboxes')
const successElement = document.querySelector('#success')
const errorElement = document.querySelector('#error')
const messageElement = document.querySelector('#message')
const backToForm = document.querySelector('#backToForm')
const buttonSave = document.querySelector('#save')
const buttonSearch = document.querySelector('#search-button')
const inputSearch = document.querySelector('#search-input')
const loadingSearch = document.querySelector('#search-loading')
const emptySearch = document.querySelector('#search-empty')
const resultSearch = document.querySelector('#search-result')
const numberElement = document.querySelector('#number')

let rowIdSelected = null
let currentRecord = null
let columnNameMapped = null
let columnRefIds = []
let columnRefNames = []
let isSaving = false
let refListSelectedIds = []
let refListSelectedNames = []
let refListAll = []

/* TITLE */
const updateNumber = () => {
  numberElement.textContent =
    refListSelectedIds.length > 0 ? refListSelectedIds.length : 'Aucune'
}

/* FORM */
const updateRefsList = () => {
  checkboxesElement.innerHTML = ''
  if (!refListSelectedNames) return
  for (let i = 0; i < refListSelectedNames.length; i++) {
    addSelectedCheckboxe({
      name: currentRecord[columnRefNames][i],
      disabled: false,
      checked: true,
    })
  }
}

const addSelectedCheckboxe = (props) => {
  const checkbox = getCheckbox(props)
  const input = checkbox.querySelector('input')
  input.addEventListener('change', () => {
    const index = refListAll.Nom_de_collectivite.indexOf(input.value)
    const id = refListAll.id[index]
    if (input.checked) refListSelectedIds.push(id)
    else refListSelectedIds = refListSelectedIds.filter((refId) => refId !== id)
    updateNumber()
  })
  updateNumber()
  checkboxesElement.appendChild(checkbox)
}

const getCheckbox = (props) => {
  const { name, disabled, checked } = props
  const checkboxId = `id-${name}`
  const fieldset = document.createElement('div')
  fieldset.classList.add('fr-fieldset__element')
  const group = document.createElement('div')
  group.classList.add('fr-checkbox-group', 'fr-mb-2w')
  const label = document.createElement('label')
  label.classList.add('fr-label')
  label.setAttribute('for', checkboxId)
  label.textContent = name
  const input = document.createElement('input')
  input.setAttribute('type', 'checkbox')
  input.setAttribute('value', name)
  input.setAttribute('id', checkboxId)
  input.checked = checked
  if (disabled.length > 0) {
    input.setAttribute('disabled', true)
    const span = document.createElement('span')
    span.textContent = disabled
    span.classList.add('fr-hint-text')
    label.appendChild(span)
  }
  group.appendChild(input)
  group.appendChild(label)
  fieldset.appendChild(group)
  return fieldset
}

/* RESET */
const reset = () => {
  resetView()
  resetSearch()
}

const resetView = () => {
  successElement.classList.add('fr-hidden')
  errorElement.classList.add('fr-hidden')
  messageElement.classList.add('fr-hidden')
  formElement.classList.remove('fr-hidden')
}

const resetSearch = () => {
  inputSearch.value = ''
  resultSearch.innerHTML = ''
  emptySearch.classList.add('fr-hidden')
  loadingSearch.classList.add('fr-hidden')
}

/* MESSAGE */
backToForm.addEventListener('click', reset)

const displayMessage = (type) => {
  if (type === 'success') successElement.classList.remove('fr-hidden')
  if (type === 'error') errorElement.classList.remove('fr-hidden')
  messageElement.classList.remove('fr-hidden')
  formElement.classList.add('fr-hidden')
}

/* SEARCH */
inputSearch.addEventListener('input', () => {
  const searchValue = inputSearch.value.trim().toLowerCase()
  if (searchValue.length === 0) resetSearch()
})

buttonSearch.addEventListener('click', async (event) => {
  event.preventDefault()
  resultSearch.innerHTML = ''

  const searchValue = inputSearch.value.trim().toLowerCase()
  if (searchValue.length < 3) return
  loadingSearch.classList.remove('fr-hidden')

  if (refListAll.length === 0) {
    refListAll = await grist.docApi.fetchTable('Collectivites')
  }

  const foundRefs = refListAll.Nom_complet.filter((name, index) => {
    if (typeof name !== 'string') return false
    let isFound = true
    if (isFound) isFound = name.toLowerCase().indexOf(searchValue) === 0
    if (isFound && refListSelectedIds)
      isFound = !refListSelectedIds.includes(refListAll.id[index])
    return isFound
  })

  if (foundRefs.length === 0) {
    emptySearch.textContent = `Aucun résultat trouvé pour la recherche « ${searchValue} »`
    emptySearch.classList.remove('fr-hidden')
    loadingSearch.classList.add('fr-hidden')
    return
  }

  for (let i = 0; i < foundRefs.length; i++) {
    const index = refListAll.Nom_complet.indexOf(foundRefs[i])
    const hasCST = refListAll.Scrutin_CST[index] !== null

    const props = {
      name: foundRefs[i],
      disabled: hasCST
        ? `Est déjà rattaché au scrutin CST ${refListAll.Scrutin_CST[index]}`
        : false,
      checked: false,
    }

    const checkbox = getCheckbox(props)
    const input = checkbox.querySelector('input')
    input.addEventListener('change', () => {
      if (input.checked) {
        props.checked = true
        const id = refListAll.id[index]
        refListSelectedIds.push(id)
        addSelectedCheckboxe(props)
      }
      checkbox.classList.add('fr-hidden')
    })
    resultSearch.appendChild(checkbox)
  }

  resultSearch.classList.remove('fr-hidden')
  loadingSearch.classList.add('fr-hidden')
})

/* SUBMIT */
buttonSave.addEventListener('click', async () => {
  isSaving = true
  try {
    console.warn(
      'CHA refListSelectedIds.toString()',
      refListSelectedIds.toString()
    )
    await grist.selectedTable.update({
      id: rowIdSelected,
      fields: {
        [columnRefIds]: `[${refListSelectedIds.toString()}]`,
      },
    })
    displayMessage('success')
  } catch (e) {
    displayMessage('error')
    console.error('ERROR', e)
  }
})

/* TABLE */
const getRefsListValues = () => {
  grist.docApi.fetchTable('Collectivites').then((response) => {
    refListAll = response
  })
}

/* GRIST */
grist.onRecords((table, mapping) => {
  // Les données dans la table ont changé.
  columnNameMapped = mapping['Name']
  columnRefIds = mapping['RefIds']
  columnRefNames = mapping['RefNames']
  getRefsListValues()
})

grist.onRecord((record) => {
  // Le curseur a été déplacé.
  currentRecord = record
  rowIdSelected = record.id
  refListSelectedIds = currentRecord[columnRefIds] || []
  refListSelectedNames = currentRecord[columnRefNames]
    ? currentRecord[columnRefNames].sort((a, b) => a.localeCompare(b))
    : []
  updateRefsList()
  updateNumber()
  namesElement.forEach((name) => {
    name.textContent = record[columnNameMapped]
  })
  if (!isSaving) reset()
  isSaving = false
  window.scrollTo(0, 0)
})
