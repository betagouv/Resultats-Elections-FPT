<script setup>
import { ref, reactive, computed } from 'vue'
import { computedAsync } from '@vueuse/core'
import gristUtils from '@shared/utils/grist.js'
import valuesUtils from '@shared/utils/values.js'
import GristContainer from '@shared/components/GristContainer.vue'
import writeXlsxFile from 'write-excel-file'
import IconCheck from '@shared/components/IconCheck.vue'
import { DsfrButton } from '@gouvminint/vue-dsfr'

const currentRecord = ref()
const tableData = ref([])
const tableDataFiltered = ref([])
const firstColumnMapped = ref()
const otherColumnsMapped = ref()
const filtersColumnsMapped = ref()
const currentPage = ref(0)
const openedFiltersModal = ref(false)

/* EXPORT */
const isGeneratingFile = ref(false)
const buttonLabel = computed(() => {
  const rowsName = tableRows.value.length > 1 ? 'collectivités' : 'collectivité'
  return isGeneratingFile.value ? 'Téléchargement en cours...' : `Télécharger les ${tableRows.value.length} ${rowsName} (Excel)`
})
const downloadExcel = async () => {
  const data = generateExcelData()
  isGeneratingFile.value = true
  await writeXlsxFile(data, {
    // TODO: rendre le nom du fichier dynamique
    fileName: 'liste-collectivites.xlsx'
  })
  isGeneratingFile.value = false
}

const generateExcelData = () => {
  const data = []
  const headers = []
  for(const header of tableHeader.value) {
    headers.push({value: header.label})
  }
  data.push(headers)
  for(const row of tableRows.value) {
    const rowFormatted = []
    for(const cell of row) {
      rowFormatted.push({
        type: String,
        value: formatCellValue(cell),
      })
    }
    data.push(rowFormatted)
  }
  return data
}

const formatCellValue = (cell) => {
  if(cell.type === 'Bool') return cell.value ? 'Oui' : 'Non'
  else if(!cell.value) return ''
  else return cell.value.toString()
}


/* SEARCH */
const search = ref()
const isSearching = ref(false)
const trimSearch = ref('')

const onSearch = () => {
  currentPage.value = 0
  trimSearch.value = search.value.trim()
  isSearching.value = true
  tableDataFiltered.value = tableData.value.filter(record => {
    return valuesUtils.isInString(record[firstColumnMapped.value], trimSearch.value)
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

/* FILTERS */
const formFilters = reactive({
  inputs: {}
})

const filtersColumnsInfos = computed(() => {
  if(!filtersColumnsMapped.value) return []
  const filters = []
  for(const column of filtersColumnsMapped.value) {
    const columnInfos = gristUtils.getColumnInfos(column, tableColumnsInfos.value)
    formFilters.inputs[columnInfos.colId] = ''
    filters.push({
      label: columnInfos.label,
      type: columnInfos.type,
      id: columnInfos.colId,
      description: columnInfos.description,
    })
  }
  return filters
})

const resetFilters = () => {
  const filtersKeys = Object.keys(formFilters.inputs)
  for(const key of filtersKeys) {
    formFilters.inputs[key] = ''
  }
}

const applyFilters = () => {
  console.log('applyFilters')
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

const updateCurrentPage = (page) => {
  currentPage.value = page
  backToTop()
}

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
  {
    name: 'Filtres',
    description: 'Colonnes à ajouter dans les filtres',
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
  filtersColumnsMapped.value = mapping['Filtres']
}

/* VUE */
const backToTop = () => {
  window.scrollTo(0, 0, 'smooth')
}
</script>
<template>
  <GristContainer @update:record="onRecord" @update:records="onRecords" :columns="gristColumns">
    <div class="vue-tableau">
      <div class="fr-pt-3w fr-px-3w">
        <div class="fr-grid-row fr-grid-row--right">
          <DsfrSearchBar
            v-model="search" 
            class="vue-tableau__search-bar"
            button-text="Rechercher" 
            placeholder="Rechercher une collectivité par son nom" 
            :large="true" 
            @search="onSearch()" 
            @update:modelValue="onSearchUpdate()"
          />
          <DsfrButton 
            class="fr-ml-2w"
            secondary
            label="Filtrer"
            @click="openedFiltersModal = true"
          />
        </div>
        <div class="fr-grid-row fr-grid-row--middle fr-my-2w">
          <div class="fr-col-12 fr-col-md-6">
            <p class="fr-mb-0">
              {{ tableRows.length }} {{ tableRows.length > 1 ? 'collectivités' : 'collectivité' }}
              <span v-if="isSearching">pour la recherche : "{{ trimSearch }}"</span>
            </p>
          </div>
          <div class="fr-col-12 fr-col-md-6 fr-grid-row fr-grid-row--right">
            <DsfrButton 
              v-if="displayTable"
              :label="buttonLabel" 
              size="medium"
              tertiary
              class="fr-mr-0"
              :disabled="isGeneratingFile"
              @click="downloadExcel" />
          </div>
        </div>
      </div>
      <DsfrDataTable 
        v-if="displayTable"
        class="vue-tableau__table fr-table--bordered"
        :headers-row="tableHeader"
        :rows="tableRows"
        :pagination="true"
        :pagination-options="['100', '200', '500']"
        pagination-wrapper-class="fr-px-4w fr-pt-2w"
        :rows-per-page="100"
        :current-page="currentPage"
        @update:current-page="updateCurrentPage"
      >
        <template #cell="{ cell }" class="fr-col--sm">
          <p v-if="cell.type === 'Bool'" class="app-flex-center">
            <IconCheck v-if="cell.value" class="vue-tableau__icon-check fr-text-title--blue-france" />
          </p>
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
    <DsfrModal v-model:opened="openedFiltersModal" @close="openedFiltersModal = false" size="large">
      <div>
        <p class="fr-h6">Utilisez les filtres ci-dessous pour affiner la liste des collectivités affichées dans le tableau</p>
        <form>
          <div v-for="filter in filtersColumnsInfos" :key="filter">
            <div v-if="filter.type === 'Bool'">
              <DsfrRadioButtonSet 
                v-model="formFilters.inputs[filter.id]"
                inline
                :legend="filter.label"
                :hint="filter.description"
                :options="[{value: '1', label: 'Oui', name: filter.id}, {value: '0', label: 'Non', name:filter.id, name: filter.id}]"
              />
            </div>
          </div>
        </form>
        <div class="fr-grid-row fr-grid-row--center">
          <DsfrButton label="Réinitiliser les filtres" secondary @click="resetFilters" class="fr-mr-2w" />
          <DsfrButton label="Appliquer les filtres" primary @click="applyFilters" />
        </div>
      </div>
    </DsfrModal>
  </GristContainer>
</template>

<style lang="css">
/* TABLE */
.vue-tableau__table table tbody td:first-child{
  background-color: var(--background-alt-grey) !important; 
  max-width: 20rem !important;
  white-space: normal !important;
}

.vue-tableau__search-bar {
  flex-grow: 1;
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

/* ICON */
.vue-tableau__icon-check {
  width: 1.5rem;
  height: 1.5rem;
}
</style>