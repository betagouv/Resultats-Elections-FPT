<script setup>
import { ref, computed } from 'vue'
import { DsfrButton } from '@gouvminint/vue-dsfr'
import gristUtils from '@shared/utils/grist.js'
import GristContainer from '@shared/components/GristContainer.vue'

const currentRecord = ref({})
const filesMapped = ref()

/* FILES */
const attachmentIds = ref([])
const fileUrls = ref([])
const isLoading = ref(false)
const hasError = ref(false)
const buttonPreviewLabel = computed(() => attachmentIds.value.length > 1 ? 'Prévisualiser les fichiers' : 'Prévisualiser le fichier')

const resetPreviews = () => {
  fileUrls.value = []
  isLoading.value = false
  hasError.value = false
}

const checkAttachmentHasChanged = () => {
  const newAttachmentIds = currentRecord.value?.[filesMapped.value] || []
  const needsRefresh = newAttachmentIds.join() !== attachmentIds.value.join()
  if (needsRefresh) {
    attachmentIds.value = newAttachmentIds
    resetPreviews()
  }
}

const previewFiles = async () => {
  if (isLoading.value) return
  const currentAttachmentIds = attachmentIds.value
  isLoading.value = true
  hasError.value = false
  try {
    const { baseUrl, token } = await gristUtils.getAccessToken()
    // Ignore la réponse si la ligne a changé pendant la récupération du token
    if (currentAttachmentIds !== attachmentIds.value) return
    fileUrls.value = currentAttachmentIds.map((id) => `${baseUrl}/attachments/${id}/download?auth=${token}&inline=1`)
  } catch {
    hasError.value = true
  } finally {
    isLoading.value = false
  }
}

/* GRIST */
const gristColumns = [
  {
    name: 'fichiers',
    description: 'Colonne contenant les fichiers PDF',
    type: 'Attachments',
  },
]

const onRecord = (record) => {
  currentRecord.value = record
  checkAttachmentHasChanged()
}

const onRecords = (params) => {
  const { mapping } = params
  filesMapped.value = mapping?.['fichiers']
  checkAttachmentHasChanged()
}
</script>

<template>
  <GristContainer :columns="gristColumns" @update:record="onRecord" @update:records="onRecords">
    <main>
      <p v-if="!attachmentIds.length" class="fr-p-3w">Aucun fichier n'a été ajouté</p>
      <template v-else>
        <p v-if="hasError" class="fr-px-3w fr-pt-3w fr-mb-0">Une erreur est survenue lors du chargement de la prévisualisation.</p>
        <template v-if="fileUrls.length">
          <iframe v-for="(url, index) in fileUrls" :key="url" :src="url" :title="`Fichier ${index + 1}`" class="vue-previsualisation__file"></iframe>
        </template>
        <DsfrButton
          v-else
          :label="buttonPreviewLabel"
          icon="ri-eye-line"
          class="fr-m-3w"
          :disabled="isLoading"
          @click="previewFiles"
        />
      </template>
    </main>
  </GristContainer>
</template>

<style scoped>
.vue-previsualisation__file {
  width: 100%;
  height: 100vh;
  border: none;
}
</style>
