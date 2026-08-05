<script setup>
import { ref, computed } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps(['fileName', 'label', 'getData'])
const isDownloading = ref(false)
const buttonLabel = computed(() => isDownloading.value ? 'Téléchargement en cours...' : props.label)

const downloadExcel = async () => {
  isDownloading.value = true
  try {
    const { default: writeExcelFile } = await import('write-excel-file/browser')
    const data = props.getData()
    await writeExcelFile(data).toFile(props.fileName)
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
