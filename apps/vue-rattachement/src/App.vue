<script setup>
import { ref, computed } from 'vue'
import gristUtils from '@shared/utils/grist.js'
import GristContainer from '@shared/components/GristContainer.vue'
import CollectiviteSearch from './components/CollectiviteSearch.vue'

/* Grist data */
const searchColumnName = 'Nom_de_collectivite_AFFICHE'
const typeScrutinsOptions = [
  { text: 'Sélectionner une option', value: '', disabled: true },
  { text: 'CAP A', value: 'CAP A' },
  { text: 'CAP B', value: 'CAP B' },
  { text: 'CAP C', value: 'CAP C' },
  { text: 'CAP (A+B)', value: 'CAP (A+B)' },
  { text: 'CAP (A+C)', value: 'CAP (A+C)' },
  { text: 'CAP (B+C)', value: 'CAP (B+C)' },
  { text: 'CAP (A+B+C)', value: 'CAP (A+B+C)' },
]

/* INFORMATIONS */
const currentRecord = ref({})
const nameMapped = ref()
const refIdsMapped = ref()
const refNamesMapped = ref()
const typeMapped = ref()
const hiddenFormMapped = ref()
const scrutinName = ref(null)
const refListAll = ref(null)
const selectedItems = ref([])
const selectedType = ref('')
const isLoading = ref(false)
const isSaving = ref(false)
const displayView = ref('form')
const reRender = ref(0)

const selectedIds = computed(() => selectedItems.value.map((item) => item.id))

const selectedCountLabel = computed(() =>
  selectedItems.value.length > 0 ? selectedItems.value.length : 'Aucune'
)

const selectedCheckboxes = computed(() =>
  selectedItems.value.map((item) => ({
    id: `selected-${item.id}`,
    name: `selected-${item.id}`,
    label: item.name,
    value: item.id,
  }))
)

const isFormHidden = computed(() =>
  hiddenFormMapped.value && currentRecord.value[hiddenFormMapped.value]
)

const setScrutinName = async () => {
  const tableId = await gristUtils.getCurrentTableID()
  scrutinName.value = tableId.split('_').pop()
}

const addCollectivite = (item) => {
  if (selectedIds.value.includes(item.id)) return
  selectedItems.value.push(item)
}

const onSelectedChange = (values) => {
  const nextIds = values || []
  selectedItems.value = selectedItems.value.filter((item) => nextIds.includes(item.id))
}

/* FORM */
const fillForm = () => {
  const names = currentRecord.value[refNamesMapped.value]
    ? [...currentRecord.value[refNamesMapped.value]].sort((a, b) => a.localeCompare(b))
    : []

  selectedItems.value = names.map((name) => {
    const index = refListAll.value?.[searchColumnName]?.indexOf(name)
    return {
      id: index >= 0 ? refListAll.value.id[index] : null,
      name,
    }
  }).filter((item) => item.id != null)

  selectedType.value = typeMapped.value ? currentRecord.value[typeMapped.value] || '' : ''
}

const saveRecord = async () => {
  isLoading.value = true
  isSaving.value = true
  try {
    const fields = {
      [refIdsMapped.value]: `[${selectedIds.value.toString()}]`,
    }
    if (typeMapped.value) {
      fields[typeMapped.value] = selectedType.value
    }
    await grist.selectedTable.update({
      id: currentRecord.value.id,
      fields,
    })
    displayView.value = 'success'
  } catch (error) {
    displayView.value = 'error'
    console.error('ERROR', error)
  } finally {
    isLoading.value = false
  }
}

const backToForm = () => {
  fillForm()
  reRender.value++
  displayView.value = 'form'
}

/* GRIST */
const gristColumns = [
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
  {
    name: 'Type',
    description: 'Type de scrutin',
    optional: true,
  },
  {
    name: 'HiddenForm',
    description: 'Formulaire non modifiable si',
    optional: true,
  },
]

const onRecord = (record) => {
  currentRecord.value = record
  if (!isSaving.value) {
    fillForm()
    reRender.value++
    displayView.value = 'form'
  }
  isSaving.value = false
  window.scrollTo(0, 0)
}

const onRecords = async (params) => {
  const { mapping } = params
  nameMapped.value = mapping['Name']
  refIdsMapped.value = mapping['RefIds']
  refNamesMapped.value = mapping['RefNames']
  typeMapped.value = mapping['Type'] || null
  hiddenFormMapped.value = mapping['HiddenForm'] || null
  await setScrutinName()
  refListAll.value = await gristUtils.getTable('Table_collectivites')
  fillForm()
}
</script>

<template>
  <GristContainer
    :columns="gristColumns"
    @update:record="onRecord"
    @update:records="onRecords"
  >
    <main class="fr-container fr-p-3w">
      <DsfrAlert
        v-if="isFormHidden"
        type="info"
        title="Formulaire non modifiable"
        :description="currentRecord[hiddenFormMapped]"
      />

      <template v-else>
        <DsfrAlert
          v-if="displayView === 'success'"
          type="success"
          title="Modifications enregistrées"
          description="Retrouver les informations du scrutin dans le résumé à gauche."
        />
        <DsfrAlert
          v-if="displayView === 'error'"
          type="error"
          title="Une erreur technique est survenue"
          description="Merci de recommencer votre saisie, nous nous excusons pour la gène occasionnée."
        />
        <div v-if="displayView !== 'form'" class="fr-grid-row fr-grid-row--center fr-my-2w">
          <DsfrButton secondary @click="backToForm">Revenir au formulaire</DsfrButton>
        </div>

        <form v-if="displayView === 'form'" class="fr-mb-2w" @submit.prevent>
          <h1 class="fr-h6">
            Modifier le scrutin {{ currentRecord[nameMapped] }} :
          </h1>

          <DsfrSelect
            v-if="typeMapped"
            v-model="selectedType"
            label="Type de scrutin :"
            :options="typeScrutinsOptions"
          />

          <fieldset class="fr-fieldset">
            <legend class="fr-fieldset__legend--regular fr-fieldset__legend">
              {{ selectedCountLabel }} collectivité(s) rattachée(s) :
            </legend>
            <DsfrCheckboxSet
              v-if="selectedCheckboxes.length > 0"
              :model-value="selectedIds"
              :options="selectedCheckboxes"
              @update:model-value="onSelectedChange"
            />
          </fieldset>

          <CollectiviteSearch
            :key="reRender"
            :selected-ids="selectedIds"
            :scrutin-name="scrutinName"
            :allow-already-linked="!!typeMapped"
            :collectivite-search-name="searchColumnName"
            @select="addCollectivite"
          />

          <DsfrButton :disabled="isLoading" @click="saveRecord">
            Enregistrer les modifications
          </DsfrButton>
        </form>
      </template>
    </main>
  </GristContainer>
</template>
