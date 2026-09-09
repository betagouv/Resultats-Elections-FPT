<script setup>
import { computed } from 'vue'
import valuesUtils from '@shared/utils/values.js'

const props = defineProps(['data', 'currentRecord', 'tableColumnsInfos'])
const value = computed(() => props.currentRecord[props.data])
const isList = computed(() => value.value && typeof value.value === 'object' && value.value.length > 0)
const columnInfo = computed(() => props.tableColumnsInfos.find(column => column.colId === props.data))
const isPercent = computed(() => columnInfo.value ? valuesUtils.isPercent(columnInfo.value) : false)
const label = computed(() => columnInfo.value?.label || null)
const getPrettyValue = (value) => valuesUtils.prettify(value)
const getPercentValue = (value) => valuesUtils.prettifyToPercent(value)
</script>

<template>
  <li class="fr-pb-0 fr-mb-1w" data-dgcl-testid="fiche-field-value">
    <div v-if="isList">
      <p class="fr-mb-0" data-dgcl-testid="fiche-simple-value-label">{{ label }} :</p>
      <ul class="fr-mb-3w" data-dgcl-testid="fiche-simple-value-list">
        <li v-for="item in value" :key="item">{{ getPrettyValue(item) }}</li>
      </ul>
    </div>
    <p v-else-if="isPercent" class="fr-mb-0" data-dgcl-testid="fiche-simple-value-single">{{ label }} : {{ getPercentValue(value) }}</p>
    <p v-else class="fr-mb-0" data-dgcl-testid="fiche-simple-value-single">{{ label }} : {{ getPrettyValue(value) }}</p>
  </li>
</template>
