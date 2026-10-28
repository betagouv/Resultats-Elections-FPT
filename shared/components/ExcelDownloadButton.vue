<script setup>
import { ref, computed } from 'vue'
import { DsfrButton } from '@gouvminint/vue-dsfr'
import valuesUtils from '@shared/utils/values.js'

defineOptions({ inheritAttrs: false })

const props = defineProps(['fileName', 'label', 'getData', 'getColumns'])
const isDownloading = ref(false)
const buttonLabel = computed(() => isDownloading.value ? 'Téléchargement en cours...' : props.label)

const downloadExcel = async () => {
  isDownloading.value = true
  try {
    const { default: writeExcelFile } = await import('write-excel-file/browser')
    const data = props.getData()
    const columns = props.getColumns?.(data) // Optional : columns widths
    await writeExcelFile(data, { columns }).toFile(`${props.fileName}-${valuesUtils.getFileTimestamp()}.xlsx`)
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
