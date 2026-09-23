<script setup>
import { DsfrButton } from '@gouvminint/vue-dsfr'
import gristUtils from '@shared/utils/grist.js'

const props = defineProps(['rowId', 'fileColumn', 'attachments', 'fileName'])

const displayFile = async () => {
  if (!props.attachments?.length) return
  const attachmentId = props.attachments[0]
  const { baseUrl, token } = await grist.docApi.getAccessToken({ readOnly: false })
  const url = `${baseUrl}/attachments/${attachmentId}/download?auth=${token}`
  window.open(url, '_blank')
}

const deleteFile = async () => {
  const tableId = await gristUtils.getCurrentTableID()
  const fields = { [props.fileColumn]: ['L'] }
  await grist.docApi.applyUserActions([['UpdateRecord', tableId, props.rowId, fields]])
}
</script>

<template>
  <p class="fr-hint-text fr-mb-1w">{{ fileName }}</p>
  <div>
    <DsfrButton
      secondary
      label="Télécharger"
      icon="fr-icon-file-download-fill"
      class="fr-mr-1v fr-mb-1v"
      @click="displayFile"
    />
    <DsfrButton
      tertiary
      label="Supprimer"
      icon="fr-icon-delete-bin-line"
      class="fr-mb-1v"
      @click="deleteFile"
    />
  </div>
</template>
