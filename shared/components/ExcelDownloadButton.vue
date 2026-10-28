<script setup>
import { ref, computed } from 'vue'
import { DsfrButton } from '@gouvminint/vue-dsfr'
import valuesUtils from '@shared/utils/values.js'

defineOptions({ inheritAttrs: false })

const props = defineProps(['fileName', 'label', 'getData'])
const isDownloading = ref(false)
const buttonLabel = computed(() => isDownloading.value ? 'Téléchargement en cours...' : props.label)

/* STYLE */
const excelFont = { fontFamily: 'Calibri', fontSize: 11 }
const excelCellStyle = {
  ...excelFont,
  align: 'center',
  alignVertical: 'center',
  wrap: true,
  borderStyle: 'thin',
  borderColor: '#000000',
}
const excelHeaderStyle = { ...excelCellStyle, backgroundColor: '#5B9BD5', height: 30 }

const getStyledData = (data) => data.map((row, rowIndex) => {
  const style = rowIndex === 0 ? excelHeaderStyle : excelCellStyle
  return row.map(cell => ({ ...cell, ...style }))
})

const getColumnWidth = (cell, columnIndex) => {
  if (cell?.format === '0.00%') return 20
  if (cell?.type === Number || cell?.type === Boolean) return 15
  return 50
}

const getColumns = (data) => data[0].map((_, columnIndex) => ({ width: getColumnWidth(data[1]?.[columnIndex], columnIndex) }))

const downloadExcel = async () => {
  isDownloading.value = true
  try {
    const { default: writeExcelFile } = await import('write-excel-file/browser')
    const data = props.getData()
    await writeExcelFile(getStyledData(data), { columns: getColumns(data) }, excelFont).toFile(`${props.fileName}-${valuesUtils.getFileTimestamp()}.xlsx`)
  } finally {
    isDownloading.value = false
  }
}
</script>

<template>
  <DsfrButton
    size="medium"
    tertiary
    :label="buttonLabel"
    :disabled="isDownloading"
    @click="downloadExcel"
  />
</template>
