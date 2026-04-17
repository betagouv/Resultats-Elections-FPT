<script setup>
import { reactive, computed } from 'vue'
import gristUtils from '@shared/utils/grist.js'
import { useFiltersStore } from '@/store/filters'

/* STORE */
const filtersStore = useFiltersStore()
const emit = defineEmits(['close'])

/* PROPS */
const props = defineProps(['isOpen', 'filtersColumnsMapped', 'tableColumnsInfos'])
const inputs = reactive({})

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

/* APPLY */
const applyFilters = () => {
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
  emit('close')
}
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