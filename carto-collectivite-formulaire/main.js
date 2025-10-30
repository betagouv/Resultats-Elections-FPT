/* IMPORTS */
import gristUtils from '../scripts/utils/grist.js'

/* VAR */
const namesElement = document.querySelectorAll('[data-name="collectivite"]')
const dataInputs = document.querySelector('#data-inputs')
const formElement = document.querySelector('#form')
const successElement = document.querySelector('#success')
const errorElement = document.querySelector('#error')
const messageElement = document.querySelector('#message')
const backToForm = document.querySelector('#backToForm')

let rowIdSelected = null
let columnNameMapped = null
let dataMapped = []
let tableColumnsInfos = []
let currentRecord = null
let isSaving = false

/* FORM */
const generateForm = async () => {
  dataInputs.innerHTML = ''
  const data = gristUtils.getColumnsInfos(dataMapped, tableColumnsInfos)
  for (let i = 0; i < data.length; i++) {
    const type = gristUtils.getHtmlType(data[i].type)
    let input = null
    if (type === 'number' || type === 'text')
      input = generateInputText(data[i], type, 'fr-col-12')
    else if (type === 'checkbox')
      input = generateInputCheckbox(data[i], 'fr-col-12')
    else if (type === 'select')
      input = await generateSelectDropdown(data[i], 'fr-col-12')
    dataInputs.appendChild(input)
  }
}

const generateSelectDropdown = async (column, classToAdd) => {
  const tableId = column.type.replace('Ref:', '')
  const refRecords = await grist.docApi.fetchTable(tableId)
  const columnNames = Object.keys(refRecords)
  const columnToDisplay = columnNames[columnNames.length - 1]

  const div = document.createElement('div')
  div.classList.add('fr-select-group')
  if (classToAdd) div.classList.add(classToAdd)

  const label = document.createElement('label')
  label.classList.add('fr-label')
  label.setAttribute('for', column.colId)
  label.textContent = column.label

  const select = document.createElement('select')
  select.classList.add('fr-select')
  select.setAttribute('name', column.colId)
  select.setAttribute('tableId', tableId)

  const disabledOption = document.createElement('option')
  disabledOption.text = 'Sélectionner une option'
  disabledOption.setAttribute('disabled', true)
  disabledOption.setAttribute('selected', true)
  select.appendChild(disabledOption)

  for (let i = 0; i < refRecords.id.length; i++) {
    const option = document.createElement('option')
    const valueText = refRecords[columnToDisplay][i]
    option.value = refRecords.id[i]
    option.text = valueText
    option.setAttribute('data-text', valueText)
    select.appendChild(option)
  }
  div.appendChild(label)
  div.appendChild(select)
  return div
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
  const allSelects = formElement.querySelectorAll('select')
  for (let i = 0; i < allSelects.length; i++) {
    const select = allSelects[i]
    const name = select.getAttribute('name')
    values[name] = Number(select.value)
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

  const selects = formElement.querySelectorAll('select')
  for (let i = 0; i < selects.length; i++) {
    const select = selects[i]
    const name = select.getAttribute('name')
    const value = currentRecord[name]
    if (value) {
      const optionSelected = select.querySelector(
        `option[data-text="${value}"]`
      )
      const optionValue = optionSelected.getAttribute('value')
      select.value = optionValue
    }
  }
}

const resetView = () => {
  formElement.classList.remove('fr-hidden')
  successElement.classList.add('fr-hidden')
  errorElement.classList.add('fr-hidden')
  messageElement.classList.add('fr-hidden')
  formElement.reset()
  prefillForm()
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
grist.onRecords((table, mapping) => {
  // Les données dans la table ont changé.
  columnNameMapped = mapping['Nom']
  dataMapped = mapping['Data']
})

grist.onRecord((record) => {
  // Le curseur a été déplacé.
  currentRecord = record
  rowIdSelected = record.id
  namesElement.forEach((name) => {
    name.textContent = record[columnNameMapped]
  })
  if (!isSaving) resetView()
  isSaving = false
  window.scrollTo(0, 0)
})

grist.ready({
  requiredAccess: 'full',
  columns: [
    {
      name: 'Nom',
      description: 'Nom de la collectivite',
    },
    {
      name: 'Data',
      description: 'Colonnes des champs à remplir',
      allowMultiple: true,
    },
  ],
})

/* VIEW */
const initView = async () => {
  tableColumnsInfos = await gristUtils.getTableColumnsInfos()
  await generateForm()
}
initView()
