<script setup>
import { ref, computed, watch } from 'vue'
import { computedAsync } from '@vueuse/core'
import gristUtils from '@shared/utils/grist.js'
import GristContainer from '@shared/components/GristContainer.vue'
import FormSaisie from './components/FormSaisie.vue'

/* INFORMATIONS */
const currentRecord = ref({})
const titleMapped = ref()
const requiredFieldMapped = ref()
const disabledCheckboxeMapped = ref()
const firstGroupMapped = ref([])
const secondGroupMapped = ref([])
const hiddenFormMapped = ref()
const formModels = ref({})
const isLoading = ref(false)
const displayView = ref('form')

/* CONFIGURATION */
const configurationName = 'fieldsets-names'
const gristConfiguration = {
  name: configurationName,
  label: 'Noms des groupes de champs à remplir, séparés d\'un point-virgule',
}

/* LEGENDES */
const getLegends = (configuration) => configuration ? configuration.split(';') : []
const legends = computedAsync(async () => getLegends(await grist.getOption(configurationName)), [])
const firstGroupLegend = computed(() => legends.value[0] || 'Résultats des votes')
const secondGroupLegend = computed(() => legends.value[1] || 'Voix des organisations syndicales')

/* TABLE */
const tableColumnsInfos = computedAsync(async () => await grist.getOption('tableColumnInfos'), [])

/* FORMULAIRE */
const requiredFields = computed(() => [requiredFieldMapped.value, disabledCheckboxeMapped.value].filter(field => field))
const groupsFields = computed(() => [...firstGroupMapped.value, ...secondGroupMapped.value])
const allFields = computed(() => [...requiredFields.value, ...groupsFields.value])
const requiredInputs = computed(() => getFormInputs(requiredFields.value))
const firstGroupInputs = computed(() => getFormInputs(firstGroupMapped.value))
const secondGroupInputs = computed(() => getFormInputs(secondGroupMapped.value))
const groupsInputs = computed(() => [...firstGroupInputs.value, ...secondGroupInputs.value])

const getFormInputs = (fields) => {
  if (tableColumnsInfos.value.length <= 0) return []
  return fields.reduce((inputs, field) => {
    const infos = gristUtils.getColumnInfos(field, tableColumnsInfos.value)
    if (infos) inputs.push({ infos, type: gristUtils.getHtmlType(infos.type), name: infos.colId })
    return inputs
  }, [])
}

const updateField = (name, value) => {
  formModels.value[name] = value
}

const fillForm = () => {
  for (const field of allFields.value) {
    const cell = currentRecord.value[field]
    formModels.value[field] = cell ?? ''
  }
  if (areGroupsDisabled.value) emptyGroupsInputs()
}

/* DESACTIVATION DES GROUPES DE CHAMPS */
const areGroupsDisabled = computed(() => disabledCheckboxeMapped.value ? formModels.value[disabledCheckboxeMapped.value] === true : false)

watch(areGroupsDisabled, (isChecked) => {
  if (isChecked) emptyGroupsInputs()
  else fillGroupsInputs()
})

const emptyGroupsInputs = () => {
  for (const input of groupsInputs.value) {
    formModels.value[input.name] = input.type === 'checkbox' ? false : ''
  }
}

const fillGroupsInputs = () => {
  for (const input of groupsInputs.value) {
    formModels.value[input.name] = currentRecord.value[input.name] ?? ''
  }
}

/* ENREGISTREMENT */
const getFormValuesCleaned = () => {
  let values = {}
  for (const input of requiredInputs.value) {
    values[input.name] = getInputValue(input)
  }
  for (const input of groupsInputs.value) {
    values[input.name] = areGroupsDisabled.value ? null : getInputValue(input)
  }
  return values
}

const getInputValue = (input) => {
  const value = formModels.value[input.name]
  if (input.type === 'checkbox') return value === true
  if (value === '' || value === null || value === undefined) return null
  return input.type === 'number' ? Number(value) : value
}

const saveRecord = async () => {
  isLoading.value = true
  const newValues = getFormValuesCleaned()
  try {
    await grist.selectedTable.update({
      id: currentRecord.value.id,
      fields: newValues,
    })
    displayView.value = 'success'
  } catch (error) {
    displayView.value = 'error'
  } finally {
    isLoading.value = false
  }
}

/* GRIST */
const gristColumns = [
  {
    name: 'title',
    description: 'Titre du formulaire',
  },
  {
    name: 'requiredField',
    description: "Nombre d'inscrits seul champ obligatoire",
    optional: true,
  },
  {
    name: 'disabledCheckboxe',
    description: 'Checboxe qui désactive les groupes de champs si cochée',
    optional: true,
  },
  {
    name: 'firstGroup',
    description: 'Premier groupe de champs',
    allowMultiple: true,
  },
  {
    name: 'secondGroup',
    description: 'Second groupe de champs',
    allowMultiple: true,
  },
  {
    name: 'hiddenForm',
    description: 'Formulaire non modifiable si',
    optional: true,
  }
]

const onRecord = (record) => {
  currentRecord.value = record
  fillForm()
}

const onRecords = (params) => {
  const { mapping } = params
  titleMapped.value = mapping['title']
  requiredFieldMapped.value = mapping['requiredField']
  disabledCheckboxeMapped.value = mapping['disabledCheckboxe']
  firstGroupMapped.value = mapping['firstGroup'] || []
  secondGroupMapped.value = mapping['secondGroup'] || []
  hiddenFormMapped.value = mapping['hiddenForm']
}

const onConfiguration = (configurations) => updateViewFromConfiguration(configurations)
const onOptions = (options) => updateViewFromConfiguration(options)

const updateViewFromConfiguration = (configurations) => {
  for (const configuration of configurations) {
    if (configuration.name === 'tableColumnInfos') tableColumnsInfos.value = configuration.value
    if (configuration.name === configurationName) legends.value = getLegends(configuration.value)
  }
}
</script>

<template>
  <GristContainer @update:record="onRecord" @update:records="onRecords" :columns="gristColumns" :configuration="gristConfiguration" @update:configuration="onConfiguration" @update:options="onOptions">
    <main class="fr-container fr-p-3w">
      <DsfrAlert v-if="currentRecord[hiddenFormMapped]" type="info" title="Formulaire non modifiable" :description="currentRecord[hiddenFormMapped]" />
      <FormSaisie
        v-else
        :display-view="displayView"
        :title="currentRecord[titleMapped]"
        :required-inputs="requiredInputs"
        :first-group-inputs="firstGroupInputs"
        :second-group-inputs="secondGroupInputs"
        :first-group-legend="firstGroupLegend"
        :second-group-legend="secondGroupLegend"
        :form-models="formModels"
        :are-groups-disabled="areGroupsDisabled"
        :is-loading="isLoading"
        @back="displayView = 'form'"
        @save="saveRecord"
        @update:field="updateField"
      />
    </main>
  </GristContainer>
</template>
