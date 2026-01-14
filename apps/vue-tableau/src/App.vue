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
    columnsNames.push(columnName)
  })
  return columnsNames
})

const tableRows = computed(() => {
  if(tableHeader.value.length === 0) return []
  const rows = []
  tableData.value.forEach(record => {
    const row = []
    allColumnsMapped.value.forEach(column => {
      row.push(record[column])
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
      />
      <p v-else>Chargement en cours...</p>
    </div>
  </GristContainer>
</template>