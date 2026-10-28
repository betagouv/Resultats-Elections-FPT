<script setup>
import { computed } from 'vue'
import gristUtils from '@shared/utils/grist.js'

const props = defineProps(['label', 'value'])
const isEmpty = computed(() => !props.value?.length)

/* Get data */
const getInfos = () => {
  return props.value.map((id, index) => ({
    id,
    fileName: `le fichier ${index + 1}`,
    url: `https://grist.numerique.gouv.fr/o/dgcl#ouvrir-le-fichier-${id}`,
  }))
}

/* Files */
const attachments = computed(() => isEmpty.value ? [] : getInfos())

/* Open */
const openFile = async (id) => {
  const url = await gristUtils.getAttachmentUrl(id)
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <div class="fr-mb-0">
    {{ label }} :
    <a v-if="attachments.length === 1" :href="attachments[0].url" target="_blank" rel="noopener noreferrer" @click.prevent="openFile(attachments[0].id)">Ouvrir le fichier</a>
    <ul v-else-if="attachments.length">
      <li v-for="attachment in attachments" :key="attachment.id">
        <a :href="attachment.url" target="_blank" rel="noopener noreferrer" @click.prevent="openFile(attachment.id)">Ouvrir {{ attachment.fileName }}</a>
      </li>
    </ul>
    <span v-else>Non renseigné</span>
  </div>
</template>
