<script setup>
import { computed } from 'vue'
import gristUtils from '@shared/utils/grist.js'

const props = defineProps(['label', 'value', 'baseUrl'])
const isEmpty = computed(() => !props.value?.length)

/* Get data */
const getUrl = (id) => `${props.baseUrl}/attachments/${id}/download`
const getInfos = () => {
  return props.value.map((id, index) => ({
    id,
    fileName: `le fichier ${index + 1}`,
    url: getUrl(id),
  }))
}

/* Files */
const attachments = computed(() => isEmpty.value ? [] : getInfos())

/* Open */
const openLink = async (url) => {
  const urlWithToken = await gristUtils.addTokenToUrl(url)
  window.open(urlWithToken, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <div class="fr-mb-0">
    {{ label }} :
    <ul v-if="attachments.length">
      <li v-for="attachment in attachments" :key="attachment.id">
        <a :href="attachment.url" target="_blank" rel="noopener noreferrer" @click.prevent="openLink(attachment.url)">Ouvrir {{ attachment.fileName }}</a>
      </li>
    </ul>
    <span v-else>Non renseigné</span>
  </div>
</template>
