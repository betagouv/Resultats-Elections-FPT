<script setup>
import { ref, computed, watch } from 'vue'
import { computedAsync } from '@vueuse/core'
import gristUtils from '@shared/utils/grist.js'
import GristContainer from '@shared/components/GristContainer.vue'
import FormSaisie from './components/FormSaisie.vue'

/* INFORMATIONS */
const currentRecord = ref({})
const titleMapped = ref()
const nombreInscritsMapped = ref()
const absenceCandidatMapped = ref()
const resultatsMapped = ref([])
const syndicatsMapped = ref([])
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
const legends = computedAsync(async () => getLegends(await grist.getOption(configurationName)), [])
const getLegends = (configuration) => configuration ? configuration.split(';') : []
const votesLegend = computed(() => legends.value[0] || 'Résultats des votes')
const syndicatsLegend = computed(() => legends.value[1] || 'Voix des organisations syndicales')

/* TABLE */
const tableColumnsInfos = computedAsync(async () => await grist.getOption('tableColumnInfos'), [])

/* FORMULAIRE */
const requiredFields = computed(() => [nombreInscritsMapped.value, absenceCandidatMapped.value].filter(field => field))
const candidatFields = computed(() => [...resultatsMapped.value, ...syndicatsMapped.value])
const allFields = computed(() => [...requiredFields.value, ...candidatFields.value])

const requiredInputs = computed(() => getFormInputs(requiredFields.value))
const votesInputs = computed(() => getFormInputs(resultatsMapped.value))
const syndicatsInputs = computed(() => getFormInputs(syndicatsMapped.value))
const candidatInputs = computed(() => [...votesInputs.value, ...syndicatsInputs.value])

const getFormInputs = (fields) => {
  if (tableColumnsInfos.value.length <= 0) return []
  return fields.reduce((inputs, field) => {
    const infos = gristUtils.getColumnInfos(field, tableColumnsInfos.value)
    if (infos) inputs.push({ infos, type: getInputType(infos.type), name: infos.colId })
    return inputs
  }, [])
}

// Seuls les nombres et les cases à cocher sont saisis ici, les autres colonnes sont traitées comme du texte
const getInputType = (type) => {
  const htmlType = gristUtils.getHtmlType(type)
  return htmlType === 'number' || htmlType === 'checkbox' ? htmlType : 'text'
}

const updateField = (name, value) => {
  formModels.value[name] = value
}

const fillForm = () => {
  for (const field of allFields.value) {
    const cell = currentRecord.value[field]
    formModels.value[field] = cell ?? ''
  }
  if (hasNoCandidat.value) emptyCandidatInputs()
}

/* ABSENCE DE CANDIDAT */
const hasNoCandidat = computed(() => absenceCandidatMapped.value ? formModels.value[absenceCandidatMapped.value] === true : false)

watch(hasNoCandidat, (isChecked) => {
  if (isChecked) emptyCandidatInputs()
  else fillCandidatInputs()
})

const emptyCandidatInputs = () => {
  for (const input of candidatInputs.value) {
    formModels.value[input.name] = input.type === 'checkbox' ? false : ''
  }
}

const fillCandidatInputs = () => {
  for (const input of candidatInputs.value) {
    formModels.value[input.name] = currentRecord.value[input.name] ?? ''
  }
}

/* ENREGISTREMENT */
const getFormValuesCleaned = () => {
  let values = {}
  for (const input of requiredInputs.value) {
    values[input.name] = getInputValue(input)
  }
  for (const input of candidatInputs.value) {
    values[input.name] = hasNoCandidat.value ? null : getInputValue(input)
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
    fillForm()
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
    name: 'nombreInscrits',
    description: "Nombre d'inscrits",
    optional: true,
  },
  {
    name: 'absenceCandidat',
    description: "Colonne s'il n'y a pas de candidat",
    optional: true,
  },
  {
    name: 'resultats',
    description: 'Colonnes qui comptabilisent les votes',
    allowMultiple: true,
  },
  {
    name: 'syndicats',
    description: 'Colonnes qui comptabilisent les voix des syndicats',
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
  nombreInscritsMapped.value = mapping['nombreInscrits']
  absenceCandidatMapped.value = mapping['absenceCandidat']
  resultatsMapped.value = mapping['resultats'] || []
  syndicatsMapped.value = mapping['syndicats'] || []
  hiddenFormMapped.value = mapping['hiddenForm']
  fillForm()
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
        :votes-inputs="votesInputs"
        :syndicats-inputs="syndicatsInputs"
        :votes-legend="votesLegend"
        :syndicats-legend="syndicatsLegend"
        :form-models="formModels"
        :has-no-candidat="hasNoCandidat"
        :is-loading="isLoading"
        @back="displayView = 'form'"
        @save="saveRecord"
        @update:field="updateField"
      />
    </main>
  </GristContainer>
</template>
