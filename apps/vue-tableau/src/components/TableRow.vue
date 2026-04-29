<script setup>
import { ref } from 'vue'
import IconCheck from '@shared/components/IconCheck.vue'

const props = defineProps(['cell', 'colKey', 'isSelected', 'isFirstColumn'])
const emit = defineEmits(['selectRow'])

const clickCheckboxeCursor = () => {
  emit('selectRow', props.cell.id)
}
</script>

<template>
  <div v-if="isFirstColumn" class="table-row__checkbox">
    <DsfrCheckbox :modelValue="isSelected" :label="cell.value" :small="true" @update:modelValue="clickCheckboxeCursor" :readonly="isSelected"/>
  </div>
  <DsfrBadge v-else-if="cell.isDSFRBadge" :label="cell.value.text" :type="cell.value.type" />
  <p v-else-if="cell.type === 'Bool'" class="app-flex-center">
    <IconCheck v-if="cell.value" class="vue-tableau__icon-check fr-text-title--blue-france" />
  </p>
  <DsfrTag v-else-if="cell.type.indexOf('Ref:') > -1" :label="cell.value" />
  <ul v-else-if="cell.hasMultipleValues">
    <li v-for="value in cell.value">
      <p class="fr-mb-0">{{ value }}</p>
    </li>
  </ul>
  <p class="fr-mb-0" v-else>{{ cell.value }}</p>
</template>

<style>
.table-row__checkbox .fr-fieldset__element {
  margin-bottom: 0 !important;
}
</style>