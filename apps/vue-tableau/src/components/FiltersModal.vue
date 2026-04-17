<script setup>
import { reactive, computed, onBeforeUpdate } from 'vue'
import gristUtils from '@shared/utils/grist.js'
import { useFiltersStore } from '@/store/filters'

/* SETUP */
const filtersStore = useFiltersStore()
const emit = defineEmits(['close'])
const props = defineProps(['isOpen', 'filtersColumnsMapped', 'tableColumnsInfos'])
const inputs = reactive({})

/* DATA */
const filterInfos = computed(() => {
  if(!props.filtersColumnsMapped) return []
  const filters = []
  for(const column of props.filtersColumnsMapped) {
    const columnInfos = gristUtils.getColumnInfos(column, props.tableColumnsInfos)
    if (columnInfos.type !== 'Bool') continue  // Only bool filters are supported for now
    filters.push({
      label: columnInfos.label,
      type: columnInfos.type,
      id: columnInfos.colId,
      description: columnInfos.description,
    })
  }
  return filters
})

/* INPUTS */
const prefillInputs = () => {
  const inputsKey = Object.keys(inputs)
  for (const key of inputsKey) {
    let value = ''
    const activeFilter = filtersStore.getActiveFilters.find(storeFilter => storeFilter.id === key)
    if (activeFilter) value = activeFilter.value === true ? '1' : '0'
    inputs[key] = value
  }
}

/* APPLY FILTERS */
const applyFilters = () => {
  filtersStore.resetFilters()
  addFiltersToStore()
  emit('close')
}

const addFiltersToStore = () => {
  const filtersIds = Object.keys(inputs)
  for(const id of filtersIds) {
    const value = inputs[id]
    if (value === '') continue
    const name = filterInfos.value.find(filter => filter.id === id).label
    filtersStore.addFilter({
      id,
      name: name,
      value: value === '1',
      valueToDisplay: value === '1' ? 'Oui' : 'Non',
    })
  }
}

/* BEFORE UPDATE */
onBeforeUpdate(prefillInputs)
</script>
<template>
  <DsfrModal :opened="isOpen" @close="emit('close')">
    <div>
      <p class="fr-h6">Utilisez les filtres ci-dessous pour affiner la liste des collectivités affichées dans le tableau</p>
      <form>
        <div v-for="filter in filterInfos" :key="filter">
          <DsfrRadioButtonSet 
            v-model="inputs[filter.id]"
            inline
            :legend="filter.label"
            :hint="filter.description"
            :options="[{value: '1', label: 'Oui', name: filter.id}, {value: '0', label: 'Non', name:filter.id, name: filter.id}]"
          />
        </div>
      </form>
      <div class="fr-grid-row fr-grid-row--center">
        <DsfrButton label="Appliquer les filtres" primary @click="applyFilters" />
      </div>
    </div>
  </DsfrModal>
</template>