<script setup>
import { ref, computed } from 'vue'
import { computedAsync } from '@vueuse/core'
import gristUtils from '@shared/utils/grist.js'
import GristContainer from '@shared/components/GristContainer.vue'

const currentRecord = ref()
const tableData = ref([])
const tableDataFiltered = ref([])
const firstColumnMapped = ref()
const otherColumnsMapped = ref()

/* SEARCH */
const search = ref()
const isSearching = ref(false)
const trimSearch = ref('')

const onSearch = () => {
  trimSearch.value = search.value.trim()
  isSearching.value = true
  tableDataFiltered.value = tableData.value.filter(record => {
    return record[firstColumnMapped.value].toLowerCase().includes(trimSearch.value.toLowerCase())
  })
}

const onSearchUpdate = () => {
  if(search.value.trim() === '') deleteSearch()
}

const deleteSearch = () => {
  isSearching.value = false
  trimSearch.value = ''
  search.value = ''
  tableDataFiltered.value = tableData.value
}

/* TABLE */
const displayTable = computed(() => {
  return tableRows.value.length > 0 && tableHeader.value.length > 0
})
const tableColumnsInfos = computedAsync(async () => {
  return await gristUtils.getTableColumnsInfos()
}, [])

const allColumnsMapped = computed(() => {
  if(!firstColumnMapped.value || !otherColumnsMapped.value ) return []
  else return [firstColumnMapped.value, ...otherColumnsMapped.value]
})

const tableHeader = computed(() => {
  if(tableColumnsInfos.value.length === 0) return []
  const columnsNames = []
  allColumnsMapped.value.forEach(column => {
    const columnName = gristUtils.getColumnName(column, tableColumnsInfos)
    columnsNames.push({key: column, label: columnName})
  })
  return columnsNames
})

const tableRows = computed(() => {
  if(tableHeader.value.length === 0) return []
  const rows = []
  tableDataFiltered.value.forEach(record => {
    const row = []
    allColumnsMapped.value.forEach(column => {
      const infos = gristUtils.getColumnInfos(column, tableColumnsInfos.value)
      const rowValue = {
        type: infos.type,
        hasMultipleValues: record[column] && typeof record[column] === 'object',
        value: record[column],
      }
      row.push(rowValue)
    })
    rows.push(row)
  })
  return rows
})

/* GRIST */
const gristColumns = [
  {
    name: 'Première_Colonne',
    description: 'Colonne fixe du tableau',
  },
  {
    name: 'Autres_Colonnes',
    description: '',
    allowMultiple: true,
  },
]

const onRecord = (record) => {
  currentRecord.value = record
}

const onRecords = (params) => {
  const { table, mapping } = params
  tableData.value = table
  tableDataFiltered.value = table
  firstColumnMapped.value = mapping['Première_Colonne']
  otherColumnsMapped.value = mapping['Autres_Colonnes']
}
</script>
<template>
  <GristContainer @update:record="onRecord" @update:records="onRecords" :columns="gristColumns">
    <div class="vue-tableau">
      <div class="fr-p-3w fr-col-12 fr-grid-row fr-grid-row--middle">
        <div class="fr-col-12 fr-col-md-6">
          <p class="fr-mb-0">{{ tableRows.length }} {{ tableRows.length > 1 ? 'collectivités' : 'collectivité' }}
            <span v-if="isSearching">pour la recherche : "{{ trimSearch }}"</span>
          </p>
          <DsfrButton 
            v-if="isSearching"
            label="Effacer la recherche" 
            size="small" 
            icon="ri-delete-bin-line"
            @click="deleteSearch" 
            :tertiary="true" 
            class="fr-mt-1w" />
        </div>
        <DsfrSearchBar 
          class="fr-col-12 fr-col-md-6"
          v-model="search" 
          button-text="Rechercher" 
          placeholder="Rechercher une collectivité par son nom" 
          :large="true" 
          @search="onSearch()" 
          @update:modelValue="onSearchUpdate()"
        />
      </div>
      <DsfrDataTable 
        v-if="displayTable"
        class="vue-tableau__table fr-table--bordered"
        :headers-row="tableHeader"
        :rows="tableRows"
        :pagination="true"
        :pagination-options="['100', '200', '500']"
        :rows-per-page="100"
      >
        <template #cell="{ cell }">
          <DsfrBadge v-if="cell.type === 'Bool'" :type="cell.value ? 'success' : 'error'" :label="cell.value ? 'Oui' : 'Non'" />
          <DsfrTag v-else-if="cell.type.indexOf('Ref:') > -1" :label="cell.value" />
          <ul v-else-if="cell.hasMultipleValues">
            <li v-for="value in cell.value">
              <p class="fr-mb-0">{{ value }}</p>
            </li>
          </ul>
          <p class="fr-mb-0" v-else>{{ cell.value }}</p>
        </template>
      </DsfrDataTable>
      <p class="fr-p-3w" v-else-if="!displayTable && !search">Chargement en cours...</p>
    </div>
  </GristContainer>
</template>

<style lang="css">
/* TABLE */
.vue-tableau__table table tbody td:first-child{
  background-color: var(--background-alt-grey) !important; 
  max-width: 20rem !important;
  white-space: normal !important;
}


/* STICKY CELLS */
.vue-tableau__table .fr-table__container {
  overflow: initial !important;
}

.vue-tableau__table thead {
  position: sticky !important;
  top: 0px;
  z-index: 4;
}

.vue-tableau__table td:first-child, .vue-tableau__table thead th:first-child {
  position: sticky !important;
  left: 0px;
  z-index: 3;
}

</style>