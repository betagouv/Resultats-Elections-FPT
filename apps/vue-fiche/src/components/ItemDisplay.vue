<script setup>
import { computed } from 'vue'
import valuesUtils from '@shared/utils/values.js'

const props = defineProps(['data', 'currentRecord', 'tableColumnsInfos'])

const value = computed(() => props.currentRecord[props.data])
const isList = computed(() => value.value && typeof value.value === 'object' && value.value.length > 0)

/* Display */
const getPrettyLabel = (label) => {
  const columnInfo = props.tableColumnsInfos.find(column => column.colId === label)
  return columnInfo ? columnInfo.label : null
}

const getPrettyValue = (value) => valuesUtils.prettify(value)
</script>

<template>
  <li class="fr-pb-0 fr-mb-1w" data-dgcl-testid="fiche-field-value">
    <div v-if="isList">
      <p class="fr-mb-0" data-dgcl-testid="fiche-simple-value-label">{{ getPrettyLabel(data) }} :</p>
      <ul class="fr-mb-3w" data-dgcl-testid="fiche-simple-value-list">
        <li v-for="item in value" :key="item">{{ getPrettyValue(item) }}</li>
      </ul>
    </div>
    <p v-else class="fr-mb-0" data-dgcl-testid="fiche-simple-value-single">{{ getPrettyLabel(data) }} : {{ getPrettyValue(value) }}</p>
  </li>
</template>
