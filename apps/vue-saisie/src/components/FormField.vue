<script setup>
defineProps(['input', 'modelValue', 'disabled'])
const emit = defineEmits(['update:modelValue'])
</script>
<template>
  <DsfrCheckbox
    v-if="input.type === 'checkbox'"
    :model-value="modelValue === true"
    :name="input.name"
    :value="input.name"
    :label="input.infos.label"
    :hint="input.infos.description"
    :disabled="disabled"
    @update:model-value="(checked) => emit('update:modelValue', checked)"
  />
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
  />
</template>
