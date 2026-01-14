<script setup>
import { ref, computed } from 'vue'
import { computedAsync } from '@vueuse/core'
import gristUtils from '@shared/utils/grist.js'
import GristContainer from '@shared/components/GristContainer.vue'

const currentRecord = ref()
const tableData = ref([])
const firstColumnMapped = ref()
const otherColumnsMapped = ref()

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
  tableData.value.forEach(record => {
    const row = []
    allColumnsMapped.value.forEach(column => {
      const infos = gristUtils.getColumnInfos(column, tableColumnsInfos.value)
      const rowValue = {
        type: infos.type,
        hasMultipleValues: record[column] && typeof record[column] !== 'string' && record[column].length > 1,
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
  firstColumnMapped.value = mapping['Première_Colonne']
  otherColumnsMapped.value = mapping['Autres_Colonnes']
}
</script>
<template>
  <GristContainer @update:record="onRecord" @update:records="onRecords" :columns="gristColumns">
    <div class="fr-p-3w">
      <DsfrDataTable 
        v-if="displayTable"
        :headers-row="tableHeader"
        :rows="tableRows"
        :pagination="true"
        :pagination-options="['100', '200', '500']"
        :rows-per-page="100"
      >
        <template #cell="{ cell }">
          <DsfrBadge v-if="cell.type === 'Bool'" :type="cell.value ? 'success' : 'error'" :label="cell.value ? 'Oui' : 'Non'" />
          <DsfrTag v-else-if="cell.type.indexOf('Ref') > -1" :label="cell.value" />
          <ul v-else-if="cell.hasMultipleValues">
            <li v-for="value in cell.value">
              <p class="fr-mb-0">{{ value }}</p>
            </li>
          </ul>
          <span v-else>{{ cell.value }}</span>
        </template>
      </DsfrDataTable>
      <p v-else>Chargement en cours...</p>
    </div>
  </GristContainer>
</template>