<script setup>
import StatusBadge from '@shared/components/StatusBadge.vue'
defineProps(['title', 'description', 'badge', 'showBadge', 'isSelected'])
const emit = defineEmits(['select'])
</script>

<template>
  <li
    class="fr-card fr-p-1w fr-my-1w"
    :class="{ selected: isSelected }"
    @click="emit('select')"
  >
    <button type="button" class="fr-grid-row fr-grid-row--gutters">
      <div :class="showBadge ? 'fr-col-6' : 'fr-col-12'">
        <p class="fr-mb-0">{{ title }}</p>
        <p v-if="description" class="fr-text--xs fr-mb-0">{{ description }}</p>
      </div>
      <div v-if="showBadge" class="fr-col-6 fr-grid-row fr-grid-row--right">
        <StatusBadge :label="badge" />
      </div>
    </button>
  </li>
</template>
