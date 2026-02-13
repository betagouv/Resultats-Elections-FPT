<script setup>
import { ref, computed } from 'vue'
import { computedAsync } from '@vueuse/core'
import gristUtils from '@shared/utils/grist.js'
import GristContainer from '@shared/components/GristContainer.vue'

/* INFORMATIONS */
const currentRecord = ref({})
const fieldsMapped = ref([])
const titleMapped = ref()
const hiddenFormMapped = ref()
const formModels = ref({})
const isLoading = ref(false)
const displayView = ref('form')

/* TABLE */
const tableColumnsInfos = computedAsync(async () => {
  return await gristUtils.getTableColumnsInfos()
}, [])

/* FORMULAIRE */
const formInputs = computed(() => {
  if (tableColumnsInfos.value.length <= 0 || fieldsMapped.value.length <= 0) return []
  return fieldsMapped.value.map(field => {
    const infos = gristUtils.getColumnInfos(field, tableColumnsInfos.value)
    const type = gristUtils.getHtmlType(infos.type)
    return { infos, type, name: infos.colId }
  })
})

const formSelects = computedAsync(async () => {
  let options = {}
  for(let i = 0; i < formInputs.value.length; i++) {
    const isSelect = formInputs.value[i].type === 'select'
    if (!isSelect) continue
    else if (formInputs.value[i].infos.type === 'Choice') options[formInputs.value[i].name] = getChoiceOptions(formInputs.value[i].infos.widgetOptions)
    else options[formInputs.value[i].name] = await getRefOptions(formInputs.value[i].infos.type)
  }
  return options
}, {})

const getChoiceOptions = (widgetOptions) => {
  const widgetOptionsClean = JSON.parse(widgetOptions)
  const choices = []
  choices.push({
    text: '--',
    value: '',
  })
  widgetOptionsClean.choices.forEach(choice => {
    choices.push({
      text: choice,
      value: choice,
    })
  })
  return choices
}

const getRefOptions = async (type) => {
  const tableId = type.replace('Ref:', '')
  const refRecords = await gristUtils.getTable(tableId)
  const options = []
  for(let i = 0; i < refRecords.id.length; i++) {
    options.push({
      text: refRecords.Nom_complet_acronyme[i],
      value: refRecords.Nom_complet_acronyme[i],
      id: refRecords.id[i],
    })
  }
  return options
}

const fillForm = () => {
  for(let i = 0; i < fieldsMapped.value.length; i++) {
    formModels.value[fieldsMapped.value[i]] = currentRecord.value[fieldsMapped.value[i]] || ''
  }
}

const getFormValuesCleaned = () => {
  let values = {}
  for(let i = 0; i < formInputs.value.length; i++) {
    const isSelect = formInputs.value[i].type === 'select' && formInputs.value[i].infos.type !== 'Choice'
    const inputName = formInputs.value[i].name
    const value = isSelect ? getSelectRefValue(inputName, formModels.value[inputName]) : formModels.value[inputName]
    values[inputName] = value
  }
  return values
}

const getSelectRefValue = (inputName, valueToFind) => {
  return formSelects.value[inputName].find(option => option.value === valueToFind).id
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
    name: 'fields',
    description: 'Champs à modifier',
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
  fieldsMapped.value = mapping['fields']
  hiddenFormMapped.value = mapping['hiddenForm']
  fillForm()
}
</script>

<template>
  <GristContainer @update:record="onRecord" @update:records="onRecords" :columns="gristColumns">
    <main class="fr-container fr-p-3w">
      <DsfrAlert v-if="currentRecord[hiddenFormMapped]" type="info" title="Formulaire non modifiable" :description="currentRecord[hiddenFormMapped]" />
      <template v-else>
        <DsfrAlert v-if="displayView === 'success'" type="success" title="Modifications enregistrées" :description="`Les modifications ${currentRecord[titleMapped]} ont été enregistrées avec succès.`" />
        <DsfrAlert v-if="displayView === 'error'" type="error" title="Une erreur technique est survenue" description="Merci de recommencer votre saisie, nous nous excusons pour la gène occasionnée." />
        <div v-if="displayView !== 'form'" class="fr-grid-row fr-grid-row--center fr-my-2w">
          <DsfrButton @click="displayView = 'form'" secondary>Revenir au formulaire</DsfrButton>
        </div>
        <form v-if="displayView === 'form'" class="fr-mb-2w">
          <h1 class="fr-h6">Modifier {{ currentRecord[titleMapped] }}</h1>
          <fieldset class="fr-fieldset">
            <div class="fr-fieldset__element">
              <div v-for="input in formInputs" :key="input.name" class="fr-mb-2w">
                <DsfrInput
                  v-if="input.type === 'text'"
                  v-model="formModels[input.name]"
                  :label="input.infos.label"
                  :label-visible="true"
                  :hint="input.infos.description"
                />
                <DsfrSelect
                  v-else-if="input.type === 'select'"
                  v-model="formModels[input.name]"
                  :label="input.infos.label"
                  :hint="input.infos.description"
                  :options="formSelects[input.name]"
                />
              </div>
            </div>
          </fieldset>
          <DsfrButton @click="saveRecord" :disabled="isLoading">Enregistrer les modifications</DsfrButton>
        </form>
      </template>
    </main>
  </GristContainer>
</template>