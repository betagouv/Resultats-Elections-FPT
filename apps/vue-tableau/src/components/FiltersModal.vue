<script setup>
import { reactive, computed } from 'vue'
import gristUtils from '@shared/utils/grist.js'

/* PROPS */
const props = defineProps(['isOpen', 'filtersColumnsMapped', 'tableColumnsInfos'])
const filtersForm = reactive({
  inputs: {}
})

const filterInfos = computed(() => {
  if(!props.filtersColumnsMapped) return []
  const filters = []
  for(const column of props.filtersColumnsMapped) {
    const columnInfos = gristUtils.getColumnInfos(column, props.tableColumnsInfos)
    filtersForm.inputs[columnInfos.colId] = ''
    filters.push({
      label: columnInfos.label,
      type: columnInfos.type,
      id: columnInfos.colId,
      description: columnInfos.description,
    })
  }
  return filters
})

const filtersSelected = computed(() => {
  let activedFilters = []
  const filtersIds = Object.keys(filtersForm.inputs)
  for(const id of filtersIds) {
    const value = filtersForm.inputs[id]
    if (value === '') continue
    const name = filterInfos.value.find(filter => filter.id === id).label
    activedFilters.push({
      id,
      name: name,
      value: value === '1',
      valueToDisplay: value === '1' ? 'Oui' : 'Non',
    })
  }
  return activedFilters
})

/* ACTIONS */
const emit = defineEmits(['close'])
const closeModal = (updateFilters) => {
  emit('close', updateFilters)
}

const applyFilters = () => {
  emit('close', true, filtersSelected.value)
}
</script>
<template>
  <DsfrModal :opened="isOpen" @close="closeModal(false)">
    <pre>{{ filtersForm.inputs }}</pre>
    <div>
      <p class="fr-h6">Utilisez les filtres ci-dessous pour affiner la liste des collectivités affichées dans le tableau</p>
      <form>
        <div v-for="filter in filterInfos" :key="filter">
          <div v-if="filter.type === 'Bool'">
            <DsfrRadioButtonSet 
              v-model="filtersForm.inputs[filter.id]"
              inline
              :legend="filter.label"
              :hint="filter.description"
              :options="[{value: '1', label: 'Oui', name: filter.id}, {value: '0', label: 'Non', name:filter.id, name: filter.id}]"
            />
          </div>
        </div>
      </form>
      <div class="fr-grid-row fr-grid-row--center">
        <DsfrButton label="Appliquer les filtres" primary @click="applyFilters" />
      </div>
    </div>
  </DsfrModal>
</template>