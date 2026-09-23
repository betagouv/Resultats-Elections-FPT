<script setup>
import { ref } from 'vue'
import { DsfrFileUpload } from '@gouvminint/vue-dsfr'
import gristUtils from '@shared/utils/grist.js'

const props = defineProps(['rowId', 'fileColumn'])

const fileInput = ref('')
const isUploading = ref(false)
const uploadError = ref('')

const onFileChange = async (files) => {
  const file = files?.[0]
  if (!file) return
  isUploading.value = true
  uploadError.value = ''
  try {
    const { baseUrl, token } = await grist.docApi.getAccessToken({ readOnly: false })
    const attachmentIds = await uploadFile(file, baseUrl, token)
    await updateRecordFile(attachmentIds)
  } catch (error) {
    uploadError.value = `Le fichier n'a pas pu être importé : ${error.message}`
  } finally {
    fileInput.value = ''
    isUploading.value = false
  }
}

const uploadFile = async (file, baseUrl, token) => {
  const formData = new FormData()
  formData.append('upload', file, file.name)
  const response = await fetch(`${baseUrl}/attachments?auth=${token}`, {
    method: 'POST',
    body: formData,
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  })
  if (!response.ok) throw new Error(`erreur ${response.status} lors de l'envoi du fichier`)
  return await response.json()
}

const updateRecordFile = async (attachmentIds) => {
  const tableId = await gristUtils.getCurrentTableID()
  const fields = { [props.fileColumn]: ['L', ...attachmentIds] }
  await grist.docApi.applyUserActions([['UpdateRecord', tableId, props.rowId, fields]])
}
</script>

<template>
  <div>
    <DsfrFileUpload
      v-model="fileInput"
      :disabled="isUploading"
      data-dgcl-testid="fichier-upload"
      @change="onFileChange"
    />
    <p v-if="isUploading" class="fr-mt-2w">Import en cours...</p>
    <p v-else-if="uploadError" class="fr-mt-2w">{{ uploadError }}</p>
  </div>
</template>
