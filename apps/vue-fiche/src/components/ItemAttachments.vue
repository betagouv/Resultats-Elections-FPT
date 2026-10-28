<script setup>
import { computed } from 'vue'
import { computedAsync } from '@vueuse/core'
import gristUtils from '@shared/utils/grist.js'

const props = defineProps(['label', 'value'])
const isEmpty = computed(() => !props.value?.length)

/* Get data */
const getUrl = (baseUrl, id) => `${baseUrl}/attachments/${id}/download`
const getInfos = async () => {
  const { baseUrl } = await gristUtils.getAccessToken()
  return await Promise.all(props.value.map(async id => ({
    id,
    fileName: await gristUtils.getAttachmentFileName(id),
    url: getUrl(baseUrl, id),
  })))
}

/* Files */
const attachments = computedAsync(async () => isEmpty.value ? [] : await getInfos(), [])

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
        <a :href="attachment.url" target="_blank" rel="noopener noreferrer" @click.prevent="openLink(attachment.url)">{{ attachment.fileName }}</a>
      </li>
    </ul>
    <span v-else>Non renseigné</span>
  </div>
</template>
