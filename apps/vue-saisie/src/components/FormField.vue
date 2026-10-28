<script setup>
import { DsfrCheckbox, DsfrInput } from '@gouvminint/vue-dsfr'

defineProps(['input', 'modelValue', 'disabled'])
const emit = defineEmits(['update:modelValue'])
</script>
<template>
  <div v-if="input.type === 'checkbox'" class="form-field__checkboxe-container">
    <DsfrCheckbox
      :model-value="modelValue === true"
      :name="input.name"
      :value="input.name"
      :label="input.infos.label"
      :hint="input.infos.description"
      :disabled="disabled"
      @update:model-value="(checked) => emit('update:modelValue', checked)"
    />
  </div>
  <DsfrInput
    v-else
    :model-value="modelValue"
    :type="input.type"
    :min="input.type === 'number' ? 0 : undefined"
    :label="input.infos.label"
    :label-visible="true"
    :hint="input.infos.description"
    :disabled="disabled"
    @update:model-value="(value) => emit('update:modelValue', value)"
    @wheel="(event) => input.type === 'number' && event.target.blur()"
  />
</template>

<style scoped="false">
.form-field__checkboxe-container .fr-fieldset__element {
  padding-left: 0 !important;
  padding-right: 0 !important;
  margin-bottom: 0 !important;
}
</style>