<script setup>
import { ref, computed } from 'vue'
import { computedAsync } from '@vueuse/core'
import gristUtils from '@shared/utils/grist.js'
import GristContainer from '@shared/components/GristContainer.vue'

const currentRecord = ref({})
const filesMapped = ref()
const isLoading = ref(false)
const hasError = ref(false)

/* FILES */
const attachmentIds = computed(() => currentRecord.value?.[filesMapped.value] || [])
const files = computedAsync(async () => {
  hasError.value = false
  const ids = attachmentIds.value
  if (!ids.length) return []
  const { baseUrl, token } = await gristUtils.getAccessToken()
  return ids.map((id, index) => ({
    id,
    title: `Fichier ${index + 1}`,
    url: `${baseUrl}/attachments/${id}/download?auth=${token}&inline=1`,
  }))
}, [], {
  evaluating: isLoading,
  onError: () => { hasError.value = true },
})

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
}

const onRecords = (params) => {
  const { mapping } = params
  filesMapped.value = mapping['fichiers']
}
</script>

<template>
  <GristContainer :columns="gristColumns" @update:record="onRecord" @update:records="onRecords">
    <main>
      <p v-if="isLoading" class="fr-p-3w">Chargement en cours...</p>
      <p v-else-if="hasError" class="fr-p-3w">Les fichiers n'ont pas pu être chargés</p>
      <p v-else-if="!files.length" class="fr-p-3w">Aucun fichier n'a été ajouté</p>
      <template v-else>
        <iframe v-for="file in files" :key="file.id" :src="file.url" :title="file.title" class="vue-previsualisation__file"></iframe>
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
