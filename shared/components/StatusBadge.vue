<script setup>
import { computed } from 'vue'
const props = defineProps(['label'])

const type = computed(() => {
  const labelLower = props.label.toLowerCase()
  if (labelLower === 'complet' || labelLower === 'validé') return 'success'
  if (labelLower === 'incomplet' || labelLower === 'à valider') return 'error'
  return ''
})
</script>
<template>
  <DsfrBadge :type="type" :label="label" />
</template>