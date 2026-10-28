<script setup>
import { computed } from 'vue'
import { computedAsync } from '@vueuse/core'
import gristUtils from '@shared/utils/grist.js'

const props = defineProps(['label', 'value'])
const isEmpty = computed(() => !props.value?.length)
const getInfos = async () => {
  return await Promise.all(props.value.map(async id => ({
    id,
    fileName: await gristUtils.getAttachmentFileName(id),
  })))
}
const attachments = computedAsync(async () => isEmpty.value ? [] : await getInfos(), [])
const openLink = async (id) => {
  const url = await gristUtils.getAttachmentUrl(id)
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <p class="fr-mb-0">
    {{ label }} :
    <ul v-if="attachments.length">
      <li v-for="(attachment, index) in attachments">
        <a :key="attachment.id" href="#" @click.prevent="openLink(attachment.id)">{{ attachment.fileName }}</a>
      </li>
    </ul>
    <span v-else>Non renseigné</span>
  </p>
</template>
