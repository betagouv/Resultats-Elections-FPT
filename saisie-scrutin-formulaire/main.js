/* IMPORTS */
import gristUtils from '../scripts/utils/grist.js'
import Configuration from '../scripts/classes/Configuration.js'

/* VAR */
const namesElement = document.querySelectorAll('[data-name="collectivite"]')
const requiredInputs = document.querySelector('#required-inputs')
const votesInputs = document.querySelector('#votes-inputs')
const syndicatInputs = document.querySelector('#syndicats-inputs')
const formElement = document.querySelector('#form')
const successElement = document.querySelector('#success')
const errorElement = document.querySelector('#error')
const messageElement = document.querySelector('#message')
const backToForm = document.querySelector('#backToForm')
const fieldsetsNameElement = document.querySelectorAll('[data-name="js-fieldset-name"]')
const notEditableMessage = document.querySelector('[data-name="js-form-not-editable-message"]')
const notEditableAlert = document.querySelector('[data-name="js-form-not-editable-alert"]')

let rowIdSelected = null
let columnNameMapped = null
let nombreInscritsMapped = []
let absenceCandidatMapped = []
let resultatsMapped = []
let syndicatsMapped = []
let nonModifiableMapped = []
let tableColumnsInfos = []
let inputsToUpdate = []
let abscenceInput = null
let currentRecord = null
let isSaving = false
let configuration = null

/* COLUMNS */
const generateForm = () => {
  // Nombre d'inscrits
  if (nombreInscritsMapped) {
    const inscrits = gristUtils.getColumnsInfos(
      nombreInscritsMapped,
      tableColumnsInfos
    )
    const inscritInput = generateInputText(
      inscrits[0],
      gristUtils.getHtmlType(inscrits[0].type)
    )
    inscritInput.setAttribute('id', 'inscrits')
    requiredInputs.appendChild(inscritInput)
  }

  // Absence candidat
  if (absenceCandidatMapped) {
    const absence = gristUtils.getColumnsInfos(
      absenceCandidatMapped,
      tableColumnsInfos
    )
    const absenceInput = generateInputCheckbox(absence[0])
    absenceInput.setAttribute('id', 'absence')
    requiredInputs.appendChild(absenceInput)
  }

  // Résultats (1 colonne)
  for (let i = 0; i < resultatsMapped.length; i++) {
    const coloneInfo = gristUtils.getColumnInfos(
      resultatsMapped[i],
      tableColumnsInfos
    )
    const type = gristUtils.getHtmlType(coloneInfo.type)
    const isTypeText = type === 'number' || type === 'text'
    const input = isTypeText
      ? generateInputText(coloneInfo, type, 'fr-col-12')
      : generateInputCheckbox(coloneInfo, 'fr-col-12')
    votesInputs.appendChild(input)
  }

  // Voix des syndicats (2 colonnes)
  const syndicats = gristUtils.getColumnsInfos(
    syndicatsMapped,
    tableColumnsInfos
  )
  for (let i = 0; i < syndicats.length; i++) {
    const type = gristUtils.getHtmlType(syndicats[i].type)
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

const hideForm = () => {
  notEditableMessage.textContent = currentRecord[nonModifiableMapped]
  notEditableAlert.classList.remove('fr-hidden')
  formElement.classList.add('fr-hidden')
}

const prefillForm = () => {
  if (currentRecord[nonModifiableMapped]) hideForm()
  else {
    const inputs = formElement.querySelectorAll('input')
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const name = input.getAttribute('name')
      const value = currentRecord[name]
      if (typeof value === 'boolean') input.checked = value
      else input.setAttribute('value', value)
    }
  }
}

const resetView = () => {
  formElement.classList.remove('fr-hidden')
  successElement.classList.add('fr-hidden')
  errorElement.classList.add('fr-hidden')
  messageElement.classList.add('fr-hidden')
  notEditableAlert.classList.add('fr-hidden')
  formElement.reset()
  prefillForm()
  if (absenceCandidatMapped) checkAbsence()
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
  if (abscenceInput) toggleInputs(abscenceInput.checked)
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
    await grist.selectedTable.update({
      id: rowIdSelected,
      fields: formValues,
    })
    displayMessage('success')
  } catch (e) {
    displayMessage('error')
  }
})

/* GRIST */
grist.ready({
  requiredAccess: 'full',
  columns: [
    {
      name: 'NonModifiable',
      description: 'Colonne qui permet de cacher le formulaire',
      optional: true,
    },
    'ColumnName',
    {
      name: 'NombreInscrits',
      description: "Nombre d'inscrit",
      optional: true,
    },
    {
      name: 'AbsenceCandidat',
      description: "Colonne s'il n'y a pas de candidat",
      optional: true,
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
  onEditOptions: () => {
    // On clic sur "Ouvrir la configuration"
    if (configuration) configuration.open()
  },
})

grist.onRecord(async (record, mapping) => {
  // Le curseur a été déplacé.
  currentRecord = record
  rowIdSelected = record.id

  columnNameMapped = mapping['ColumnName']
  nombreInscritsMapped = mapping['NombreInscrits']
  absenceCandidatMapped = mapping['AbsenceCandidat']
  resultatsMapped = mapping['Resultats']
  syndicatsMapped = mapping['Syndicats']
  nonModifiableMapped = mapping['NonModifiable']
  namesElement.forEach((name) => {
    name.textContent = record[columnNameMapped]
  })
  if (!isSaving) resetView()
  isSaving = false
  window.scrollTo(0, 0)
})

/* COLUMNS INFOS */
const needsColumnInfos = async () => {
  if (tableColumnsInfos.length === 0) {
    tableColumnsInfos = await gristUtils.getTableColumnsInfos()
  }
}

/* CONFIGURATION */
const setupConfiguration = () => {
  configuration = new Configuration({
    name: 'fieldsets-names',
    label: 'Noms de groupes de champs à remplir, séparer d\'un point-virgule',
    onClose: () => {
      updateFieldsetsName()
    },
  })
  updateFieldsetsName()
}

const updateFieldsetsName = async () => {
  const names = await configuration.getValue()
  if (!names) return
  const namesArray = names.split(';')
  for (let i = 0; i < namesArray.length; i++) {
    fieldsetsNameElement[i].textContent = `${namesArray[i]} :`
  }
}

/* INIT */
const initView = async () => {
  setupConfiguration()
  await needsColumnInfos()
  generateForm()
  prefillForm()
  if (absenceCandidatMapped) generateAbsence()
}

initView()
