<script setup>
import { computed } from 'vue'
const props = defineProps(['label'])

const type = computed(() => {
  if (!props.label) return ''
  const labelLower = props.label.toLowerCase()
  if (labelLower === 'complet' || labelLower === 'validé') return 'success'
  if (labelLower === 'incomplet' || labelLower === 'à valider' || labelLower === 'doublon' || labelLower === 'champs manquant(s)') return 'error'
  return ''
})
</script>
<template>
  <DsfrBadge v-if="label" :type="type" :label="label" />
</template>