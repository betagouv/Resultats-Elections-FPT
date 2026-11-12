<script setup>
import { ref, computed } from 'vue'
import { computedAsync } from '@vueuse/core'
import gristUtils from '@shared/utils/grist.js'
import valuesUtils from '@shared/utils/values.js'
import GristContainer from '@shared/components/GristContainer.vue'
import ExcelDownloadButton from '@shared/components/ExcelDownloadButton.vue'

const tableData = ref([])
const dataMapped = ref([])

/* CONFIGURATION */
const configurationName = 'pageTitle'
const gristConfiguration = {
  name: configurationName,
  label: 'Titre de la page',
}
const pageTitle = computedAsync(async () => await grist.getOption(configurationName), '')

/* TABLE */
const tableColumnsInfos = computedAsync(async () => await grist.getOption('tableColumnInfos'), [])

/* EXPORT */
const excelFileName = computed(() => valuesUtils.getExcelFileName(pageTitle.value || 'export'))

const getExcelCell = (record, column) => {
  const cell = gristUtils.getCellInfos(record, column, tableColumnsInfos.value)
  const value = valuesUtils.getExcelCellValue(cell)
  return {
    type: valuesUtils.getExcelCellType(cell),
    value: Array.isArray(value) ? value.join(', ') : value,
    format: valuesUtils.getExcelCellFormat(cell),
  }
}

const generateExcelData = () => {
  const headers = dataMapped.value.map((column) => ({
    value: gristUtils.getColumnName(column, tableColumnsInfos) || column,
  }))
  const rows = tableData.value.map((record) => dataMapped.value.map((column) => getExcelCell(record, column)))
  return [headers, ...rows]
}

/* GRIST */
const gristColumns = [
  {
    name: 'data',
    description: 'Colonnes à exporter',
    optional: true,
    allowMultiple: true,
  },
]

const onRecords = (params) => {
  const { table, mapping } = params
  tableData.value = table
  dataMapped.value = mapping?.['data'] || []
}

const onConfiguration = (configurations) => updateViewFromConfiguration(configurations)
const onOptions = (options) => updateViewFromConfiguration(options)

const updateViewFromConfiguration = (configurations) => {
  for (const configuration of configurations) {
    if (configuration.name === 'tableColumnInfos') tableColumnsInfos.value = configuration.value
    if (configuration.name === configurationName) pageTitle.value = configuration.value
  }
}
</script>

<template>
  <GristContainer
    :columns="gristColumns"
    :configuration="gristConfiguration"
    @update:records="onRecords"
    @update:configuration="onConfiguration"
    @update:options="onOptions"
  >
    <div class="fr-p-3w">
      <h1 class="fr-h6" v-if="pageTitle">{{ pageTitle }}</h1>
      <p v-if="!dataMapped.length">Aucune colonne sélectionnée pour l'export</p>
      <ExcelDownloadButton
        v-else
        label="Télécharger les données (Excel)"
        :file-name="excelFileName"
        :get-data="generateExcelData"
      />
    </div>
  </GristContainer>
</template>
