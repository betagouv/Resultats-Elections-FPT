/* SETUP */
grist.ready({
  requiredAccess: 'full',
  columns: [
    'ColumnName',
    {
      name: 'NombreInscrits',
      description: "Nombre d'inscrit",
    },
    {
      name: 'AbsenceCandidat',
      description: "Colonne s'il n'y a pas de candidat",
    },
    {
      name: 'Resultats',
      description: 'Colonnes qui comptabilisent les votes',
      allowMultiple: true,
    },
    {
      name: 'Syndicats',
      description: 'Colonnes qui comptabilisent les voix des syndicats',
      allowMultiple: true,
    },
  ],
})

/* VAR */
const namesElement = document.querySelectorAll('[data-name="collectivite"]')
const fieldsetElement = document.querySelector('#fieldset')
const requiredInputs = document.querySelector('#required-inputs')
const votesInputs = document.querySelector('#votes-inputs')
const syndicatInputs = document.querySelector('#syndicats-inputs')
const formElement = document.querySelector('#form')
const successElement = document.querySelector('#success')
const errorElement = document.querySelector('#error')
const messageElement = document.querySelector('#message')
const backToForm = document.querySelector('#backToForm')

let rowIdSelected = null
let columnNameMapped = null
let fieldsMapped = []
let nombreInscritsMapped = []
let absenceCandidatMapped = []
let resultatsMapped = []
let syndicatsMapped = []
let tableColumnsInfos = []
let inputsToUpdate = []
let abscenceInput = null
let currentRecord = null
let isSaving = false

/* FUNCTIONS */
const getHtmlType = (gristName) => {
  if (gristName === 'Int' || gristName === 'Numeric') return 'number'
  if (gristName === 'Bool') return 'checkbox'
  if (gristName === 'Attachments') return 'file'
  return 'text'
}

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

const getColumnsInfos = (column) => {
  return tableColumnsInfos.filter((col) => column.includes(col.colId))
}

const getColumnInfo = (column) => {
  const index = tableColumnsInfos.findIndex((col) => col.colId === column)
  return index >= 0 ? tableColumnsInfos[index] : null
}

const generateForm = () => {
  const inscrits = getColumnsInfos(nombreInscritsMapped)
  const inscritInput = generateInputText(
    inscrits[0],
    getHtmlType(inscrits[0].type)
  )
  inscritInput.setAttribute('id', 'inscrits')
  requiredInputs.appendChild(inscritInput)

  const absence = getColumnsInfos(absenceCandidatMapped)
  const absenceInput = generateInputCheckbox(absence[0])
  absenceInput.setAttribute('id', 'absence')
  requiredInputs.appendChild(absenceInput)

  for (let i = 0; i < resultatsMapped.length; i++) {
    const coloneInfo = getColumnInfo(resultatsMapped[i])
    const type = getHtmlType(coloneInfo.type)
    const isTypeText = type === 'number' || type === 'text'
    const input = isTypeText
      ? generateInputText(coloneInfo, type, 'fr-col-12')
      : generateInputCheckbox(coloneInfo, 'fr-col-12')
    votesInputs.appendChild(input)
  }

  const syndicats = getColumnsInfos(syndicatsMapped)
  for (let i = 0; i < syndicats.length; i++) {
    const type = getHtmlType(syndicats[i].type)
    const isTypeText = type === 'number' || type === 'text'
    const input = isTypeText
      ? generateInputText(syndicats[i], type, 'fr-col-6')
      : generateInputCheckbox(syndicats[i], 'fr-col-6')
    syndicatInputs.appendChild(input)
  }
}

const generateInputText = (column, type, classToAdd) => {
  const div = document.createElement('div')
  div.classList.add('fr-input-group', 'fr-mb-2w')
  if (classToAdd) div.classList.add(classToAdd)

  const label = document.createElement('label')
  label.textContent = column.label
  label.classList.add('fr-label')
  label.setAttribute('for', column.colId)

  const description = document.createElement('span')
  description.classList.add('fr-hint-text')
  description.textContent = column.description

  const input = document.createElement('input')
  input.setAttribute('type', type)
  input.setAttribute('name', column.colId)
  input.setAttribute('id', column.colId)
  input.classList.add('fr-input')

  if (type === 'number') {
    input.setAttribute('min', 0)
    input.setAttribute('value', '')
  }

  label.appendChild(description)
  div.appendChild(label)
  div.appendChild(input)
  return div
}

const generateInputCheckbox = (column, classToAdd) => {
  const div = document.createElement('div')
  div.classList.add('fr-checkbox-group', 'fr-mb-2w')
  if (classToAdd) div.classList.add(classToAdd)

  const input = document.createElement('input')
  input.setAttribute('type', 'checkbox')
  input.setAttribute('id', column.colId)
  input.setAttribute('name', column.colId)

  const label = document.createElement('label')
  label.setAttribute('for', column.colId)
  label.textContent = column.label
  label.classList.add('fr-label')

  const description = document.createElement('span')
  description.classList.add('fr-hint-text')
  description.textContent = column.description

  label.appendChild(description)

  div.appendChild(input)
  div.appendChild(label)
  return div
}

const getFormValues = () => {
  let values = {}
  const allInputs = formElement.querySelectorAll('input')
  for (let i = 0; i < allInputs.length; i++) {
    const input = allInputs[i]
    const name = input.getAttribute('name')
    const isCheckboxe = input.getAttribute('type') === 'checkbox'
    values[name] = isCheckboxe ? input.checked : input.value
  }
  return values
}

const formatValue = (value) => {
  const isCheckboxe = value === 'on' || value === 'off'
  if (isCheckboxe) return value === 'on'
  return value
}

const prefillForm = () => {
  const inputs = formElement.querySelectorAll('input')
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i]
    const name = input.getAttribute('name')
    const value = currentRecord[name]
    if (typeof value === 'boolean') input.checked = value
    else input.setAttribute('value', value)
  }
}

const resetView = () => {
  formElement.classList.remove('fr-hidden')
  successElement.classList.add('fr-hidden')
  errorElement.classList.add('fr-hidden')
  messageElement.classList.add('fr-hidden')
  formElement.reset()
  prefillForm()
  checkAbsence()
}

/* DISABLED FIELDS */
const generateAbsence = () => {
  checkAbsence()
  watchAbsence()
}

const watchAbsence = () => {
  abscenceInput.addEventListener('input', () => {
    toggleInputs(abscenceInput.checked)
  })
}

const checkAbsence = () => {
  inputsToUpdate = [
    ...votesInputs.querySelectorAll('input'),
    ...syndicatInputs.querySelectorAll('input'),
  ]
  abscenceInput = document.querySelector('#absence input')
  toggleInputs(abscenceInput.checked)
}

const toggleInputs = (isChecked) => {
  if (isChecked) disabledInputs()
  else enabledInputs()
}

const enabledInputs = () => {
  for (let i = 0; i < inputsToUpdate.length; i++) {
    const input = inputsToUpdate[i]
    const colName = input.getAttribute('name')
    input.removeAttribute('disabled')
    input.value = currentRecord[colName]
  }
}

const disabledInputs = () => {
  for (let i = 0; i < inputsToUpdate.length; i++) {
    const input = inputsToUpdate[i]
    input.value = input.type === 'checkbox' ? 'off' : ''
    input.setAttribute('disabled', true)
  }
}

/* MESSAGE */
backToForm.addEventListener('click', resetView)

const displayMessage = (type) => {
  if (type === 'success') successElement.classList.remove('fr-hidden')
  if (type === 'error') errorElement.classList.remove('fr-hidden')
  messageElement.classList.remove('fr-hidden')
  formElement.classList.add('fr-hidden')
}

/* SUBMIT */
formElement.addEventListener('submit', async (event) => {
  event.preventDefault()
  const formValues = getFormValues()
  isSaving = true
  try {
    grist.selectedTable.update({
      id: rowIdSelected,
      fields: formValues,
    })
    displayMessage('success')
  } catch (e) {
    displayMessage('error')
  }
})

/* GRIST */
grist.onRecord(async (record, mapping) => {
  // Le curseur a été déplacé.
  currentRecord = record
  rowIdSelected = record.id

  columnNameMapped = mapping['ColumnName']
  fieldsMapped = mapping['Fields']
  nombreInscritsMapped = mapping['NombreInscrits']
  absenceCandidatMapped = mapping['AbsenceCandidat']
  resultatsMapped = mapping['Resultats']
  syndicatsMapped = mapping['Syndicats']
  namesElement.forEach((name) => {
    name.textContent = record[columnNameMapped]
  })
  if (!isSaving) resetView()
  isSaving = false
  window.scrollTo(0, 0)
})

/* INIT */
const initView = async () => {
  await getTableColumnsInfos()
  generateForm()
  prefillForm()
  generateAbsence()
}

initView()
