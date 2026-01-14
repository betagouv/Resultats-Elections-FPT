<script setup>
import { ref, computed } from 'vue'
import { computedAsync } from '@vueuse/core'
import gristUtils from '@shared/utils/grist.js'
import GristContainer from '@shared/components/GristContainer.vue'
import writeXlsxFile from 'write-excel-file'

const currentRecord = ref()
const tableData = ref([])
const tableDataFiltered = ref([])
const firstColumnMapped = ref()
const otherColumnsMapped = ref()

/* EXPORT */
const isGeneratingFile = ref(false)
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
        id: record.id,
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
      <div class="fr-pt-3w fr-px-3w">
        <DsfrSearchBar
          v-model="search" 
          button-text="Rechercher" 
          placeholder="Rechercher une collectivité par son nom" 
          :large="true" 
          @search="onSearch()" 
          @update:modelValue="onSearchUpdate()"
        />
        <div class="fr-grid-row fr-grid-row--middle fr-my-2w">
          <div class="fr-col-8">
            <p class="fr-mb-0">
              {{ tableRows.length }} {{ tableRows.length > 1 ? 'collectivités' : 'collectivité' }}
              <span v-if="isSearching">pour la recherche : "{{ trimSearch }}"</span>
            </p>
          </div>
          <div class="fr-col-4 fr-grid-row fr-grid-row--right">
            <DsfrButton 
              v-if="displayTable"
              :label="isGeneratingFile ? 'Enregistrement en cours...' : 'Enregistrer au format Excel'" 
              icon="ri-file-excel-line" 
              size="medium"
              secondary
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
        :rows-per-page="100"
        row-key="id"
      >
        <template #cell="{ cell }" class="fr-col--sm">
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